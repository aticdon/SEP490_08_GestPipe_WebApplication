import os
import sys
from google_drive_oauth_service import GoogleDriveOAuthService

class GestureSetDriveService:
    def __init__(self):
        """
        Initialize Gesture Set Drive Service
        """
        # Get the directory where this script is located
        current_dir = os.path.dirname(os.path.abspath(__file__))
        credentials_file = os.path.join(current_dir, 'credentials.json')
        token_file = os.path.join(current_dir, 'token.json')
        
        # Temporarily suppress all output from GoogleDriveOAuthService
        import contextlib
        with contextlib.redirect_stdout(sys.stderr):
            self.drive_service = GoogleDriveOAuthService(
                credentials_file=credentials_file,
                token_file=token_file
            )
        self.gesture_sets_folder = "GestureSets"
        self.active_set_folder = "ActiveSet"
        
    def ensure_base_folders(self):
        """
        Ensure GestureSets and ActiveSet folders exist
        Returns: dict with folder IDs
        """
        try:
            # Search for existing folders
            gesture_sets_folder = self._find_folder_by_name(self.gesture_sets_folder)
            active_set_folder = self._find_folder_by_name(self.active_set_folder)
            
            # Create if not exist
            if not gesture_sets_folder:
                gesture_sets_folder = self.drive_service.create_folder(self.gesture_sets_folder)
                print(f"[INFO] Created GestureSets folder: {gesture_sets_folder['id']}", file=sys.stderr)
                
            if not active_set_folder:
                active_set_folder = self.drive_service.create_folder(self.active_set_folder)
                print(f"[INFO] Created ActiveSet folder: {active_set_folder['id']}", file=sys.stderr)
                
            return {
                'gesture_sets_id': gesture_sets_folder['id'],
                'active_set_id': active_set_folder['id']
            }
            
        except Exception as e:
            print(f"[ERROR] Error ensuring base folders: {e}")
            return None
    
    def _find_folder_by_name(self, folder_name, parent_id=None):
        """
        Find folder by name
        """
        try:
            query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder'"
            if parent_id:
                query += f" and '{parent_id}' in parents"
                
            files = self.drive_service.search_files(query)
            return files[0] if files else None
            
        except Exception as e:
            print(f"[ERROR] Error finding folder: {e}")
            return None
    
    def list_gesture_sets(self):
        """
        List all gesture sets in GestureSets folder
        Returns: list of gesture set folders with metadata
        """
        try:
            # Suppress all output during operation
            import contextlib
            with contextlib.redirect_stdout(sys.stderr):
                folders = self.ensure_base_folders()
                if not folders:
                    return []
                    
                gesture_sets_id = folders['gesture_sets_id']
                
                # Search for folders in GestureSets
                query = f"'{gesture_sets_id}' in parents and mimeType='application/vnd.google-apps.folder'"
                gesture_set_folders = self.drive_service.search_files(query)
                
                # Get gesture count for each set
                gesture_sets = []
                for folder in gesture_set_folders:
                    gesture_count = self._count_gestures_in_folder(folder['id'])
                    gesture_sets.append({
                        'id': folder['id'],
                        'name': folder['name'],
                        'modified_time': folder.get('modifiedTime', ''),
                        'gesture_count': gesture_count,
                        'drive_folder': f"/GestureSets/{folder['name']}/"
                    })
                
                # Auto-cleanup duplicates before returning
                gesture_sets = self._cleanup_duplicates(gesture_sets)
                    
                print(f"[INFO] Found {len(gesture_sets)} gesture sets", file=sys.stderr)
                return gesture_sets
            
        except Exception as e:
            print(f"[ERROR] Error listing gesture sets: {e}", file=sys.stderr)
            return []
    
    def _count_gestures_in_folder(self, folder_id):
        """
        Count gesture files (.pkl or .json) in a folder
        """
        try:
            import contextlib
            with contextlib.redirect_stdout(sys.stderr):
                query = f"'{folder_id}' in parents and (name contains '.pkl' or name contains '.json')"
                files = self.drive_service.search_files(query)
                return len(files)
        except:
            return 0
    
    def get_current_active_set(self):
        """
        Get current active gesture set info
        Returns: dict with active set info or None
        """
        try:
            folders = self.ensure_base_folders()
            if not folders:
                return None
                
            active_set_id = folders['active_set_id']
            
            # Search for folders in ActiveSet (should be only 1)
            query = f"'{active_set_id}' in parents and mimeType='application/vnd.google-apps.folder'"
            active_folders = self.drive_service.search_files(query)
            
            if not active_folders:
                return None
                
            active_folder = active_folders[0]  # Should be only 1
            gesture_count = self._count_gestures_in_folder(active_folder['id'])
            
            return {
                'id': active_folder['id'],
                'name': active_folder['name'],
                'modified_time': active_folder.get('modifiedTime', ''),
                'gesture_count': gesture_count,
                'drive_folder': f"/ActiveSet/{active_folder['name']}/"
            }
            
        except Exception as e:
            print(f"[ERROR] Error getting active set: {e}")
            return None
    
    def move_folder(self, folder_id, new_parent_id, old_parent_id):
        """
        Move a folder from one parent to another
        """
        try:
            # Remove from old parent and add to new parent
            file = self.drive_service.service.files().update(
                fileId=folder_id,
                addParents=new_parent_id,
                removeParents=old_parent_id,
                fields='id, parents'
            ).execute()
            
            print(f"[INFO] Folder moved successfully: {folder_id}", file=sys.stderr)
            return file
            
        except Exception as e:
            print(f"[ERROR] Error moving folder: {e}")
            return None
    
    def copy_folder(self, source_folder_id, target_parent_id, new_name):
        """
        Copy a folder and all its contents to a new parent folder
        """
        try:
            # Create new folder in target parent
            folder_metadata = {
                'name': new_name,
                'parents': [target_parent_id],
                'mimeType': 'application/vnd.google-apps.folder'
            }
            
            new_folder = self.drive_service.service.files().create(
                body=folder_metadata,
                fields='id'
            ).execute()
            
            new_folder_id = new_folder['id']
            print(f"[INFO] Created new folder: {new_name} (ID: {new_folder_id})", file=sys.stderr)
            
            # Copy all files from source folder to new folder
            query = f"'{source_folder_id}' in parents"
            source_files = self.drive_service.search_files(query)
            
            for file in source_files:
                try:
                    # Copy each file
                    copy_metadata = {
                        'name': file['name'],
                        'parents': [new_folder_id]
                    }
                    
                    copied_file = self.drive_service.service.files().copy(
                        fileId=file['id'],
                        body=copy_metadata,
                        fields='id'
                    ).execute()
                    
                    print(f"[INFO] Copied file: {file['name']}", file=sys.stderr)
                    
                except Exception as e:
                    print(f"[WARNING] Could not copy file {file['name']}: {e}", file=sys.stderr)
            
            return new_folder
            
        except Exception as e:
            print(f"[ERROR] Error copying folder: {e}", file=sys.stderr)
            return None
    
    def publish_gesture_set(self, gesture_set_id, gesture_set_name):
        """
        Publish a gesture set: move current active to GestureSets, move selected to ActiveSet
        
        Args:
            gesture_set_id: ID of gesture set to publish
            gesture_set_name: Name of gesture set to publish
            
        Returns: dict with operation results
        """
        try:
            folders = self.ensure_base_folders()
            if not folders:
                return {'success': False, 'error': 'Could not ensure base folders'}
                
            gesture_sets_id = folders['gesture_sets_id']
            active_set_id = folders['active_set_id']
            
            result = {
                'success': True,
                'old_set_moved': False,
                'new_set_moved': False,
                'old_set_name': None,
                'new_set_name': gesture_set_name
            }
            
            # Step 1: Delete current active set (if exists) 
            current_active = self.get_current_active_set()
            if current_active:
                try:
                    self.drive_service.service.files().delete(fileId=current_active['id']).execute()
                    result['old_set_moved'] = True
                    result['old_set_name'] = current_active['name']
                    print(f"[INFO] Deleted old active set: {current_active['name']}", file=sys.stderr)
                except Exception as e:
                    print(f"[WARNING] Could not delete old active set: {e}", file=sys.stderr)
            
            # Step 2: Copy selected gesture set to ActiveSet (instead of move)
            copy_result = self.copy_folder(
                gesture_set_id,
                active_set_id,
                gesture_set_name
            )
            
            if copy_result:
                result['new_set_moved'] = True
                print(f"[INFO] Copied new gesture set to ActiveSet: {gesture_set_name}", file=sys.stderr)
            else:
                result['success'] = False
                result['error'] = 'Failed to copy new gesture set to ActiveSet'
                
            return result
            
        except Exception as e:
            print(f"[ERROR] Error publishing gesture set: {e}")
            return {'success': False, 'error': str(e)}
    
    def _cleanup_duplicates(self, gesture_sets):
        """
        Remove duplicate gesture set folders (keep the newest)
        
        Args:
            gesture_sets (list): List of gesture set dictionaries
            
        Returns:
            list: Cleaned list without duplicates
        """
        try:
            # Group by name to find duplicates
            name_groups = {}
            for gs in gesture_sets:
                name = gs['name']
                if name not in name_groups:
                    name_groups[name] = []
                name_groups[name].append(gs)
            
            # Process duplicates
            cleaned_sets = []
            for name, group in name_groups.items():
                if len(group) > 1:
                    # Sort by modified time (keep the newest)
                    group.sort(key=lambda x: x['modified_time'], reverse=True)
                    
                    # Keep the first (newest), delete the rest
                    keep = group[0]
                    delete = group[1:]
                    
                    print(f"[CLEANUP] Found {len(group)} duplicates for '{name}', keeping newest", file=sys.stderr)
                    
                    for gs in delete:
                        try:
                            # Delete the duplicate folder
                            self.drive_service.service.files().delete(fileId=gs['id']).execute()
                            print(f"[CLEANUP] Deleted duplicate: {gs['id']}", file=sys.stderr)
                        except Exception as e:
                            print(f"[CLEANUP] Error deleting {gs['id']}: {e}", file=sys.stderr)
                    
                    cleaned_sets.append(keep)
                else:
                    cleaned_sets.append(group[0])
            
            return cleaned_sets
            
        except Exception as e:
            print(f"[ERROR] Error during cleanup: {e}", file=sys.stderr)
            return gesture_sets  # Return original list if cleanup fails

# Example usage
if __name__ == "__main__":
    service = GestureSetDriveService()
    
    # Ensure base folders exist
    folders = service.ensure_base_folders()
    print(f"Base folders: {folders}")
    
    # List available gesture sets
    gesture_sets = service.list_gesture_sets()
    print(f"Available gesture sets: {gesture_sets}")
    
    # Get current active set
    active_set = service.get_current_active_set()
    print(f"Current active set: {active_set}")
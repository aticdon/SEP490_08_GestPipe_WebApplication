#!/usr/bin/env python3
"""
Upload trained model results to CustomGesture folder and cleanup
"""

import sys
import os
import shutil
# Import from current directory first
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from google_drive_oauth_service import GoogleDriveOAuthService

def upload_folder_recursive(drive_service, local_path, drive_parent_id):
    """
    Recursively upload a local folder to Google Drive
    
    Args:
        drive_service: GoogleDriveOAuthService instance
        local_path (str): Local path to upload
        drive_parent_id (str): Parent folder ID in Google Drive
    
    Returns:
        bool: True if successful
    """
    try:
        folder_name = os.path.basename(local_path)
        
        # Create folder in Google Drive
        folder_metadata = drive_service.create_folder(folder_name, drive_parent_id)
        if not folder_metadata:
            print(f"[ERROR] Failed to create folder {folder_name}")
            return False
        
        drive_folder_id = folder_metadata['id']
        print(f"[SUCCESS] Created folder {folder_name} (ID: {drive_folder_id})")
        
        # Upload files and subfolders
        for item in os.listdir(local_path):
            item_path = os.path.join(local_path, item)
            
            if os.path.isdir(item_path):
                # Recurse for subfolders
                if not upload_folder_recursive(drive_service, item_path, drive_folder_id):
                    return False
            else:
                # Upload file
                result = drive_service.upload_file(
                    file_path=item_path,
                    file_name=item,
                    folder_id=drive_folder_id
                )
                if not result:
                    print(f"[ERROR] Failed to upload file {item}")
                    return False
                print(f"[SUCCESS] Uploaded file {item}")
        
        return True
        
    except Exception as e:
        print(f"[ERROR] Failed to upload folder {local_path}: {e}")
        return False

def upload_trained_model(user_id):
    """
    Upload trained model results to CustomGesture folder and cleanup local data

    Args:
        user_id (str): User ID
    """
    try:
        drive_service = GoogleDriveOAuthService()

        # Find CustomGesture folder
        custom_folders = drive_service.search_files("name='CustomGesture' and mimeType='application/vnd.google-apps.folder' and trashed=false")
        if not custom_folders:
            print("[ERROR] CustomGesture folder not found!")
            return False
        custom_folder_id = custom_folders[0]['id']

        # User directory
        user_dir = os.path.join("..", "..", "..", "hybrid_realtime_pipeline", "code", f"user_{user_id}")

        if not os.path.exists(user_dir):
            print(f"[ERROR] User directory {user_dir} not found!")
            return False

        # Upload the user directory as a folder to CustomGesture
        result = upload_folder_recursive(drive_service, user_dir, custom_folder_id)

        if result:
            print(f"[SUCCESS] Uploaded trained model folder for user_{user_id} to CustomGesture")

            # Cleanup: remove local user directory
            try:
                shutil.rmtree(user_dir)
                print(f"[SUCCESS] Cleaned up local user directory: {user_dir}")
            except Exception as e:
                print(f"[WARNING] Failed to cleanup local directory: {e}")

            return True
        else:
            print(f"[ERROR] Failed to upload trained model folder for user_{user_id}")
            return False

    except Exception as e:
        print(f"[ERROR] Failed to upload trained model: {e}")
        return False

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Upload trained model to CustomGesture and cleanup')
    parser.add_argument('--user-id', required=True, help='User ID')
    args = parser.parse_args()

    success = upload_trained_model(args.user_id)
    sys.exit(0 if success else 1)
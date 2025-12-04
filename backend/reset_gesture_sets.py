#!/usr/bin/env python3
"""
Reset script to move gesture sets back to GestureSets folder for testing
"""

import os
import sys

# Add the services directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'services'))

from gesture_set_drive_service import GestureSetDriveService

def reset_gesture_sets():
    """Reset all gesture sets back to GestureSets folder"""
    try:
        print("🔄 Resetting gesture sets for testing...")
        
        service = GestureSetDriveService()
        
        # Ensure base folders exist and get their IDs
        print("📁 Ensuring base folders exist...")
        folder_ids = service.ensure_base_folders()
        
        # Check if there's anything in ActiveSet folder
        print("🔍 Checking ActiveSet folder...")
        active_files = service.drive_service.list_files(
            folder_id=folder_ids['active_set_id']
        )
        
        # Filter for folders only
        active_folders = [f for f in active_files if f.get('mimeType') == 'application/vnd.google-apps.folder']
        
        if active_folders:
            for folder in active_folders:
                print(f"📦 Moving {folder['name']} back to GestureSets...")
                
                # Move folder back to GestureSets
                service.drive_service.move_file(
                    folder['id'], 
                    folder_ids['gesture_sets_id']
                )
                
                print(f"✅ Moved {folder['name']} back to GestureSets")
        else:
            print("ℹ️  ActiveSet folder is empty")
        
        # List current state
        print("\n📋 Current gesture sets in GestureSets folder:")
        gesture_sets = service.list_gesture_sets()
        
        for gs in gesture_sets:
            print(f"  - {gs['name']} (ID: {gs['id']})")
        
        print(f"\n✅ Reset completed! Found {len(gesture_sets)} gesture sets ready for testing")
        return True
        
    except Exception as e:
        print(f"❌ Error during reset: {e}")
        return False

if __name__ == "__main__":
    success = reset_gesture_sets()
    sys.exit(0 if success else 1)
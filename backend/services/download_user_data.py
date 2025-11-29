#!/usr/bin/env python3
"""
Download user data from Google Drive UploadGesture folder
"""

import sys
import os
import argparse
# Import from current directory first
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from google_drive_oauth_service import GoogleDriveOAuthService

def download_user_data(user_id):
    """
    Download user data from Google Drive UploadGesture folder

    Args:
        user_id (str): User ID
    """
    try:
        drive_service = GoogleDriveOAuthService()

        # Find UploadGesture folder
        upload_folders = drive_service.search_files("name='UploadGesture' and mimeType='application/vnd.google-apps.folder' and trashed=false")
        if not upload_folders:
            print("[ERROR] UploadGesture folder not found!")
            return False
        upload_folder_id = upload_folders[0]['id']

        # Find user data file
        user_files = drive_service.search_files(f"name contains '{user_id}' and '{upload_folder_id}' in parents and trashed=false")
        if not user_files:
            print(f"[ERROR] No data files found for user {user_id}")
            return False

        # User directory
        user_dir = os.path.join("..", "..", "..", "hybrid_realtime_pipeline", "code", f"user_{user_id}")
        os.makedirs(user_dir, exist_ok=True)

        # Download files
        for file_info in user_files:
            if file_info['mimeType'] != 'application/vnd.google-apps.folder':  # Skip folders
                file_path = os.path.join(user_dir, file_info['name'])
                success = drive_service.download_file(file_info['id'], file_path)
                if success:
                    print(f"[SUCCESS] Downloaded {file_info['name']}")
                else:
                    print(f"[ERROR] Failed to download {file_info['name']}")
                    return False

        print(f"[SUCCESS] Downloaded all data for user {user_id}")
        return True

    except Exception as e:
        print(f"[ERROR] Failed to download user data: {e}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Download user data from Google Drive')
    parser.add_argument('--user-id', required=True, help='User ID')
    args = parser.parse_args()

    success = download_user_data(args.user_id)
    sys.exit(0 if success else 1)
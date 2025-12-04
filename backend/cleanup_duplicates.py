#!/usr/bin/env python3
"""
Clean up duplicate gesture set folders
"""

import os
import sys

# Add the services directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'services'))

from gesture_set_drive_service import GestureSetDriveService

def cleanup_duplicates():
    """Remove duplicate gesture set folders"""
    try:
        print("🧹 Cleaning up duplicate gesture sets...")
        
        service = GestureSetDriveService()
        
        # Get all gesture sets
        gesture_sets = service.list_gesture_sets()
        
        # Group by name to find duplicates
        name_groups = {}
        for gs in gesture_sets:
            name = gs['name']
            if name not in name_groups:
                name_groups[name] = []
            name_groups[name].append(gs)
        
        # Process duplicates
        for name, group in name_groups.items():
            if len(group) > 1:
                print(f"📦 Found {len(group)} duplicates for '{name}':")
                
                # Sort by modified time (keep the newest)
                group.sort(key=lambda x: x['modified_time'], reverse=True)
                
                # Keep the first (newest), delete the rest
                keep = group[0]
                delete = group[1:]
                
                print(f"  ✅ Keeping: {keep['id']} (modified: {keep['modified_time']})")
                
                for gs in delete:
                    print(f"  🗑️  Deleting: {gs['id']} (modified: {gs['modified_time']})")
                    
                    # Delete the folder
                    try:
                        service.drive_service.service.files().delete(fileId=gs['id']).execute()
                        print(f"    ✅ Deleted successfully")
                    except Exception as e:
                        print(f"    ❌ Error deleting: {e}")
            else:
                print(f"📦 {name}: Only 1 folder (OK)")
        
        # List final state
        print("\n📋 Final gesture sets:")
        final_sets = service.list_gesture_sets()
        for gs in final_sets:
            print(f"  - {gs['name']} (ID: {gs['id']})")
        
        print(f"\n✅ Cleanup completed! {len(final_sets)} gesture sets remaining")
        return True
        
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        return False

if __name__ == "__main__":
    success = cleanup_duplicates()
    sys.exit(0 if success else 1)
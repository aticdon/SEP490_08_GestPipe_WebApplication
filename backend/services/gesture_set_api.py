#!/usr/bin/env python3
"""
API script to interact with GestureSetDriveService
Usage: python gesture_set_api.py <command> [args...]
"""

import sys
import json
import os
sys.path.append(os.path.join(os.path.dirname(__file__)))

from gesture_set_drive_service import GestureSetDriveService

def list_gesture_sets():
    """List all available gesture sets"""
    try:
        import sys
        import io
        import os
        
        # Suppress all output during execution
        original_stdout = sys.stdout
        original_stderr = sys.stderr
        
        # Redirect both stdout and stderr to devnull
        devnull = open(os.devnull, 'w')
        sys.stdout = devnull
        sys.stderr = devnull
        
        try:
            service = GestureSetDriveService()
            gesture_sets = service.list_gesture_sets()
        finally:
            # Always restore stdout and stderr
            sys.stdout = original_stdout
            sys.stderr = original_stderr
            devnull.close()
        
        # Print only the JSON result
        print(json.dumps(gesture_sets))
        
    except Exception as e:
        print(json.dumps({'error': str(e)}))

def get_current_active_set():
    """Get current active gesture set"""
    try:
        service = GestureSetDriveService()
        active_set = service.get_current_active_set()
        print(json.dumps(active_set))
    except Exception as e:
        print(json.dumps({'error': str(e)}))

def publish_gesture_set(gesture_set_id, gesture_set_name):
    """Publish a gesture set"""
    try:
        import sys
        import io
        import os
        
        # Suppress all output during execution
        original_stdout = sys.stdout
        original_stderr = sys.stderr
        
        # Redirect both stdout and stderr to devnull
        devnull = open(os.devnull, 'w')
        sys.stdout = devnull
        sys.stderr = devnull
        
        try:
            service = GestureSetDriveService()
            result = service.publish_gesture_set(gesture_set_id, gesture_set_name)
            
            # Add gesture count to result
            if result['success']:
                try:
                    # Get gesture count of newly active set
                    active_set = service.get_current_active_set()
                    result['gesture_count'] = active_set['gesture_count'] if active_set else 0
                except:
                    result['gesture_count'] = 0
        finally:
            # Always restore stdout and stderr
            sys.stdout = original_stdout
            sys.stderr = original_stderr
            devnull.close()
        
        # Print only the JSON result
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))

def ensure_base_folders():
    """Ensure base folders exist"""
    try:
        service = GestureSetDriveService()
        folders = service.ensure_base_folders()
        print(json.dumps(folders))
    except Exception as e:
        print(json.dumps({'error': str(e)}))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No command specified'}))
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'list_gesture_sets':
        list_gesture_sets()
    elif command == 'get_active_set':
        get_current_active_set()
    elif command == 'publish_gesture_set':
        if len(sys.argv) < 4:
            print(json.dumps({'success': False, 'error': 'Missing arguments: gesture_set_id and gesture_set_name'}))
        else:
            publish_gesture_set(sys.argv[2], sys.argv[3])
    elif command == 'ensure_folders':
        ensure_base_folders()
    else:
        print(json.dumps({'error': f'Unknown command: {command}'}))
        sys.exit(1)
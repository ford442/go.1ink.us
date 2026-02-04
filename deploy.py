import os
import paramiko
import getpass
import concurrent.futures

# --- Server Configuration ---
# Replace these with your server's details.
# It's better to use environment variables or a config file for sensitive data.
HOSTNAME = "1ink.us"
PORT = 22  # Default SFTP/SSH port
USERNAME = "ford442"

# --- Project Configuration ---
# The local directory to upload from.
LOCAL_DIRECTORY = "dist"
# The directory on the server where the files should go (e.g., 'public_html/wasm-game').
REMOTE_DIRECTORY = "go.1ink.us"

def collect_deployment_tasks(local_path, remote_path):
    """
    Traverse the local directory and return lists of directories to create
    and files to upload.
    """
    dirs_to_create = []
    files_to_upload = []

    # Add the root directory itself
    dirs_to_create.append(remote_path)

    for root, dirs, files in os.walk(local_path):
        # Skip .git directories
        if '.git' in dirs:
            dirs.remove('.git')
            # print(f"Skipping .git directory: {os.path.join(root, '.git')}")
        
        # Calculate relative path from the base local_path
        rel_path = os.path.relpath(root, local_path)
        
        if rel_path == ".":
            current_remote = remote_path
        else:
            # Ensure forward slashes for SFTP
            current_remote = os.path.join(remote_path, rel_path).replace(os.sep, '/')

        # Add subdirectories
        for d in dirs:
            remote_d = os.path.join(current_remote, d).replace(os.sep, '/')
            dirs_to_create.append(remote_d)

        # Add files
        for f in files:
            local_f = os.path.join(root, f)
            remote_f = os.path.join(current_remote, f).replace(os.sep, '/')
            files_to_upload.append((local_f, remote_f))
            
    return dirs_to_create, files_to_upload

def upload_single_file(transport, local_path, remote_path):
    """
    Worker function to upload a single file using a fresh SFTP channel.
    """
    try:
        with transport.open_sftp_client() as sftp:
            print(f"Uploading file: {local_path} -> {remote_path}")
            sftp.put(local_path, remote_path)
    except Exception as e:
        print(f"❌ Failed to upload {local_path}: {e}")
        raise e

def upload_directory(sftp_client, local_path, remote_path):
    """
    Uploads a directory and its contents to the remote server using parallel uploads.
    """
    print(f"Scanning '{local_path}'...")
    dirs_to_create, files_to_upload = collect_deployment_tasks(local_path, remote_path)

    print(f"Found {len(dirs_to_create)} directories and {len(files_to_upload)} files.")

    # 1. Create Directories (Sequential)
    for d in dirs_to_create:
        try:
            # print(f"Creating remote directory: {d}")
            sftp_client.mkdir(d)
        except IOError:
            # Directory usually exists
            pass

    # 2. Upload Files (Parallel)
    transport = None
    try:
        channel = sftp_client.get_channel()
        if channel:
            transport = channel.get_transport()
    except Exception:
        pass

    if transport and transport.active:
        print(f"🚀 Starting parallel upload of {len(files_to_upload)} files...")
        
        # Use ThreadPoolExecutor for concurrency
        # Adjust max_workers as needed (5-10 is usually safe for SFTP)
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [
                executor.submit(upload_single_file, transport, local, remote)
                for local, remote in files_to_upload
            ]
            
            # Wait for all uploads to complete
            done, not_done = concurrent.futures.wait(futures)
            
            # Check for exceptions
            failed = False
            for f in done:
                if f.exception():
                    failed = True
            
            if failed:
                print("❌ Some files failed to upload.")
    else:
        print("⚠️ Transport unavailable for parallelism. Falling back to serial upload.")
        for local, remote in files_to_upload:
            print(f"Uploading file: {local} -> {remote}")
            sftp_client.put(local, remote)

def main():
    """
    Main function to connect to the server and start the upload process.
    """
    password = 'GoogleBez12!' # getpass.getpass(f"Enter password for {USERNAME}@{HOSTNAME}: ")

    transport = None
    sftp = None
    try:
        # Establish the SSH connection
        transport = paramiko.Transport((HOSTNAME, PORT))
        print("Connecting to server...")
        transport.connect(username=USERNAME, password=password)
        print("Connection successful!")

        # Create an SFTP client from the transport
        sftp = paramiko.SFTPClient.from_transport(transport)
        print(f"Starting upload of '{LOCAL_DIRECTORY}' to '{REMOTE_DIRECTORY}'...")

        # Start the upload
        upload_directory(sftp, LOCAL_DIRECTORY, REMOTE_DIRECTORY)

        print("\n✅ Deployment complete!")

    except Exception as e:
        print(f"❌ An error occurred: {e}")
    finally:
        # Ensure the connection is closed
        if sftp:
            sftp.close()
        if transport:
            transport.close()
        print("Connection closed.")

if __name__ == "__main__":
    if not os.path.exists(LOCAL_DIRECTORY):
        print(f"Error: Local directory '{LOCAL_DIRECTORY}' not found. Did you run 'npm run build' first?")
    else:
        main()

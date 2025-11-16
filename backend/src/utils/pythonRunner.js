const { spawn } = require('child_process');

// Use absolute path to Python executable
const PYTHON_BIN = process.env.PYTHON_BIN || 'C:\\Users\\DLCH\\AppData\\Local\\Programs\\Python\\Python311\\python.exe';

const runPythonScript = (scriptName, args, workingDir) => {
  return new Promise((resolve, reject) => {
    console.log(
      `[runPythonScript] PYTHON_BIN: ${PYTHON_BIN}, Spawning: ${PYTHON_BIN} ${scriptName} ${args.join(' ')} in ${workingDir}`
    );

    const pythonProcess = spawn(PYTHON_BIN, [scriptName, ...args], {
      cwd: workingDir,
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1',  // Force UTF-8 mode
        PATH: process.env.PATH,  // Ensure PATH is included
      },
      // Remove shell to spawn python directly
      // shell: true,
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(`[${scriptName} STDOUT]: ${data.toString().trim()}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(`[${scriptName} STDERR]: ${data.toString().trim()}`);
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        const error = new Error(`Script ${scriptName} exited with code ${code}`);
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
      }
    });

    pythonProcess.on('error', (err) => {
      console.error(`[${scriptName}] Failed to start subprocess.`, err);
      reject(err);
    });
  });
};

module.exports = {
  runPythonScript,
  PYTHON_BIN,
};

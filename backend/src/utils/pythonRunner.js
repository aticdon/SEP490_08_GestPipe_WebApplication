const { spawn } = require('child_process');

const PYTHON_BIN = process.env.PYTHON_BIN || 'python';

const runPythonScript = (scriptName, args, workingDir) => {
  return new Promise((resolve, reject) => {
    console.log(
      `[runPythonScript] Spawning: ${PYTHON_BIN} ${scriptName} ${args.join(' ')} in ${workingDir}`
    );

    const pythonProcess = spawn(PYTHON_BIN, [scriptName, ...args], {
      cwd: workingDir,
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
      },
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

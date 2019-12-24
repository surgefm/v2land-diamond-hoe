import * as fs from 'fs';

function mkdir(path: string): Promise<void> {
  return new Promise((resolve) => {
    fs.access(path, (err) => {
      if (err) {
        fs.mkdir(path, () => resolve());
      } else {
        resolve();
      }
    });
  });
}

export default mkdir;

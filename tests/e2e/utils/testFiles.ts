import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAIklEQVQoU2NkYGD4z0AEMDEwMDAmGIAEMMVAjGIAEwwEAK9gCGcbYbWMAAAAAElFTkSuQmCC';

export const createTempImage = async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'civicfix-e2e-'));
  const filePath = path.join(tempDir, 'sample.png');
  await fs.writeFile(filePath, Buffer.from(base64Png, 'base64'));
  return filePath;
};

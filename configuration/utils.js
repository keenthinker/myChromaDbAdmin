import { readFile, writeFile } from 'node:fs/promises';

const configurationFilePath = new URL('./configuration.json', import.meta.url);

/**
 * Read the content of a file as a string.
 * @param {string} filePath - Path to the file.
 * @returns {Promise<string>} - File content.
 */
async function readSingleString(filePath) {
  try {
    const data = await readFile(filePath, 'utf-8');
    return data;
  } catch (error) {
    console.error(`Error while reading file: ${error.message}`);
    throw error;
  }
}

/**
 * Overwrites the content of a file with a new string.
 * @param {string} filePath - Path to the file.
 * @param {string} content - The text to write.
 */
async function writeSingleString(filePath, content) {
  try {
    await writeFile(filePath, content, 'utf-8');
    console.log('File successfully saved!');
  } catch (error) {
    console.error(`Error while writing file: ${error.message}`);
    throw error;
  }
}

export async function readConfig() {
  const content = await readSingleString(configurationFilePath);
  return JSON.parse(content);
}

export async function writeConfig(contentObject) {
  await writeSingleString(configurationFilePath, JSON.stringify(contentObject, null, 2));
}

export async function getSelectedConfiguration(configurations) {
  return configurations.filter(sc => sc.selected)[0];
}
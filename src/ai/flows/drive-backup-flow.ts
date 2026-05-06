'use server';
/**
 * @fileOverview Manages backup and restoration of application data to Google Drive.
 *
 * - saveBackupToDrive - Saves the current application data to a file in Google Drive.
 * - loadBackupFromDrive - Loads the application data from a file in Google Drive.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { google } from 'googleapis';
import { Readable } from 'stream';

const BACKUP_FILE_NAME = 'turno_maestro_backup.json';
const DRIVE_FOLDER_NAME = 'BEJARANO'; // The folder you shared with the service account

const BackupDataSchema = z.object({
  shifts: z.array(z.any()),
  messengers: z.array(z.any()),
  clients: z.array(z.any()),
});
type BackupData = z.infer<typeof BackupDataSchema>;

// Helper function to get an authenticated Google Drive client
async function getDriveClient() {
  if (!process.env.GOOGLE_CREDENTIALS) {
    throw new Error("La variable de entorno GOOGLE_CREDENTIALS no está configurada.");
  }

  try {
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    
    const auth = new google.auth.JWT(
        credentials.client_email,
        undefined,
        credentials.private_key,
        ['https://www.googleapis.com/auth/drive.file']
    );

    return google.drive({ version: 'v3', auth });
  } catch (e) {
      if (e instanceof SyntaxError) {
          console.error("Failed to parse GOOGLE_CREDENTIALS. Make sure it's a valid JSON string on a single line.", e);
          throw new Error("Las credenciales de GOOGLE_CREDENTIALS tienen un formato JSON no válido. Asegúrate de que todo el contenido esté en una sola línea en el archivo .env.");
      }
      console.error("Authentication error with Google Drive:", e);
      throw new Error("Error de autenticación con Google Drive. Verifica las credenciales.");
  }
}

// Helper to find the folder ID
async function findFolder(drive: ReturnType<typeof google.drive>) {
    try {
        const res = await drive.files.list({
            q: `mimeType='application/vnd.google-apps.folder' and name='${DRIVE_FOLDER_NAME}' and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive',
        });
        return res.data.files?.[0]?.id || null;
    } catch (error) {
        console.error("Error finding folder:", error);
        throw new Error("No se pudo encontrar la carpeta de destino en Google Drive.");
    }
}

// Helper to find the backup file ID within a specific folder
async function findBackupFileInFolder(drive: ReturnType<typeof google.drive>, folderId: string) {
  try {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and name='${BACKUP_FILE_NAME}' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });
    return res.data.files?.[0]?.id || null;
  } catch (error) {
    console.error("Error finding backup file:", error);
    throw new Error("No se pudo buscar el archivo de respaldo en Google Drive.");
  }
}


export const saveBackupToDrive = ai.defineFlow(
  {
    name: 'saveBackupToDrive',
    inputSchema: BackupDataSchema,
    outputSchema: z.string(),
  },
  async (data: BackupData) => {
    const drive = await getDriveClient();
    const folderId = await findFolder(drive);

    if (!folderId) {
        throw new Error(`No se encontró la carpeta "${DRIVE_FOLDER_NAME}" en Google Drive. Asegúrate de que exista y esté compartida con la cuenta de servicio.`);
    }

    const fileId = await findBackupFileInFolder(drive, folderId);
    
    const fileMetadata = {
      name: BACKUP_FILE_NAME,
      mimeType: 'application/json',
      parents: [folderId] // Specify the folder
    };
    
    const media = {
      mimeType: 'application/json',
      body: Readable.from(JSON.stringify(data, null, 2)),
    };

    try {
      if (fileId) {
        // Update existing file
        await drive.files.update({
          fileId: fileId,
          media: media,
        });
        return `Copia de seguridad actualizada en Google Drive.`;
      } else {
        // Create new file
        await drive.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: 'id',
        });
        return `Copia de seguridad creada en Google Drive.`;
      }
    } catch (error) {
       console.error("Drive API Error (save):", error);
       throw new Error("No se pudo guardar la copia de seguridad en Google Drive.");
    }
  }
);


export const loadBackupFromDrive = ai.defineFlow(
  {
    name: 'loadBackupFromDrive',
    inputSchema: z.void(),
    outputSchema: BackupDataSchema,
  },
  async () => {
    const drive = await getDriveClient();
    const folderId = await findFolder(drive);

    if (!folderId) {
        throw new Error(`No se encontró la carpeta "${DRIVE_FOLDER_NAME}" en Google Drive.`);
    }
    
    const fileId = await findBackupFileInFolder(drive, folderId);

    if (!fileId) {
      throw new Error(`No se encontró el archivo de copia de seguridad ('${BACKUP_FILE_NAME}') en la carpeta "${DRIVE_FOLDER_NAME}".`);
    }

    try {
      const response = await drive.files.get(
        { fileId: fileId, alt: 'media' },
        { responseType: 'stream' }
      );
      
      const fileContent = await new Promise<string>((resolve, reject) => {
          let buf = '';
          (response.data as Readable)
            .on('data', chunk => (buf += chunk))
            .on('end', () => resolve(buf))
            .on('error', err => reject(err));
      });
      
      const data = JSON.parse(fileContent);
      
      // Validate data with Zod schema
      return BackupDataSchema.parse(data);

    } catch (error) {
      console.error("Drive API Error (load):", error);
      throw new Error("No se pudo cargar la copia de seguridad desde Google Drive.");
    }
  }
);

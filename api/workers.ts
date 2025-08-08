import { VercelRequest, VercelResponse } from '@vercel/node';
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { workers, certifications, insertWorkerSchema, insertCertificationSchema } from "../shared/schema";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql);

    if (req.method === 'GET') {
      const allWorkers = await db.select().from(workers);
      return res.status(200).json(allWorkers);
    }

    if (req.method === 'POST') {
      const { worker: workerData, certifications: certificationsData = [] } = req.body;
      
      const validatedWorkerData = insertWorkerSchema.parse(workerData);
      const processedWorkerData = {
        ...validatedWorkerData,
        dateOfExpiry: validatedWorkerData.dateOfExpiry ? new Date(validatedWorkerData.dateOfExpiry) : null,
        dateOfBirth: validatedWorkerData.dateOfBirth ? new Date(validatedWorkerData.dateOfBirth) : null,
      };

      const [worker] = await db.insert(workers).values(processedWorkerData).returning();

      const createdCertifications = [];
      for (const cert of certificationsData) {
        const certificationData = {
          workerId: worker.id,
          courseId: cert.courseId,
          name: cert.name,
          certificateNumber: cert.certificateNumber,
          issuedDate: cert.issuedDate || new Date().toISOString(),
          expiryDate: cert.expiryDate || null,
          status: cert.status || 'active'
        };
        const validatedCertData = insertCertificationSchema.parse(certificationData);
        const processedCertData = {
          ...validatedCertData,
          issuedDate: validatedCertData.issuedDate ? new Date(validatedCertData.issuedDate) : new Date(),
          expiryDate: validatedCertData.expiryDate ? new Date(validatedCertData.expiryDate) : null,
        };
        const [certification] = await db.insert(certifications).values(processedCertData).returning();
        createdCertifications.push(certification);
      }

      return res.status(201).json({ worker, certifications: createdCertifications });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Workers API Error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
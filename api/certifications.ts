import { VercelRequest, VercelResponse } from '@vercel/node';
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { lte } from "drizzle-orm";
import { certifications, insertCertificationSchema } from "../shared/schema";

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
      // Check if this is the expiring endpoint
      const url = req.url || '';
      const expiringMatch = url.match(/\/expiring\/(\d+)$/);
      
      if (expiringMatch) {
        const days = parseInt(expiringMatch[1]);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() + days);
        
        const expiringCerts = await db
          .select()
          .from(certifications)
          .where(lte(certifications.expiryDate, cutoffDate));
        
        return res.status(200).json(expiringCerts);
      } else {
        const allCertifications = await db.select().from(certifications);
        return res.status(200).json(allCertifications);
      }
    }

    if (req.method === 'POST') {
      const validatedData = insertCertificationSchema.parse(req.body);
      const processedData = {
        ...validatedData,
        issuedDate: validatedData.issuedDate ? new Date(validatedData.issuedDate) : new Date(),
        expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : null,
      };
      const [certification] = await db.insert(certifications).values(processedData).returning();
      return res.status(201).json(certification);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Certifications API Error:', error);
    
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
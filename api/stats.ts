import { VercelRequest, VercelResponse } from '@vercel/node';
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { workers, courses, certifications } from "../shared/schema";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql);

    const [allWorkers, allCourses, allCertifications] = await Promise.all([
      db.select().from(workers),
      db.select().from(courses),
      db.select().from(certifications)
    ]);

    const expiringSoon = allCertifications.filter(cert => {
      if (!cert.expiryDate) return false;
      const expiry = new Date(cert.expiryDate);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return expiry <= thirtyDaysFromNow;
    });

    const stats = {
      totalWorkers: allWorkers.length,
      activeCourses: allCourses.filter(c => c.isActive).length,
      totalCertifications: allCertifications.length,
      expiringSoon: expiringSoon.length
    };

    return res.status(200).json(stats);
  } catch (error: any) {
    console.error('Stats API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
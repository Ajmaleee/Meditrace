import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Patient, Prescription } from '@/types';

/**
 * Generates a simple, print-ready prescription PDF and triggers a download.
 * This is a formatted restatement of an existing prescription record — it
 * never originates clinical content and carries no auto-generated dosing.
 */
export function downloadPrescriptionPdf(patient: Patient, prescription: Prescription) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const marginX = 48;
  let y = 56;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('MediTrace', marginX, y);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 96, 105);
  doc.text('Prescription record — demo document', marginX, y + 14);
  doc.setTextColor(20, 20, 20);

  y += 40;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient', marginX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${patient.name}  ·  Patient ID: ${patient.patientId}`, marginX, y + 14);
  doc.text(`DOB: ${format(new Date(patient.dateOfBirth), 'd MMM yyyy')}  ·  Blood group: ${patient.bloodGroup}`, marginX, y + 28);

  y += 50;
  doc.setFont('helvetica', 'bold');
  doc.text('Prescribed by', marginX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${prescription.doctorName}`, marginX, y + 14);
  doc.text(`Date: ${format(new Date(prescription.createdAt), 'd MMM yyyy')}`, marginX, y + 28);

  y += 46;
  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [['Medicine', 'Dosage', 'Frequency', 'Route', 'Duration', 'Instructions']],
    body: prescription.items.map((item) => [
      item.medicineName,
      item.dosage,
      item.frequency,
      item.route,
      `${item.durationDays} days`,
      item.instructions || '—',
    ]),
    headStyles: { fillColor: [15, 92, 122], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    styles: { cellPadding: 6 },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 30;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    'This document reflects a record created in the MediTrace prototype using fictional demo data. It is not a',
    marginX,
    finalY
  );
  doc.text('valid medical document and must not be used for actual dispensing.', marginX, finalY + 10);

  doc.save(`${patient.patientId}-prescription-${prescription.prescriptionId}.pdf`);
}

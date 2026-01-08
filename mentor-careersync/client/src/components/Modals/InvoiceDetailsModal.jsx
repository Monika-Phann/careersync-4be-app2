import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Button,
} from '@mui/material'
import { Close as CloseIcon, Download as DownloadIcon } from '@mui/icons-material'
import { InvoiceDetailsModalStyles } from './InvoiceDetailsModal.styles'
import jsPDF from 'jspdf'

function InvoiceDetailsModal({ open, onClose, invoice }) {
  if (!invoice) return null

  // Get program details from invoice data
  const programName = invoice.programName || invoice.rawInvoice?.mentor_position_snapshot || 'Shadowing Program'
  const mentorName = invoice.mentorName || invoice.rawInvoice?.mentor_name_snapshot || 'Mentor'
  const startDate = invoice.startDate || 'N/A'
  const endDate = invoice.endDate || 'N/A'
  const bookingDate = invoice.bookingDate || 'N/A'
  const studentId = invoice.user?.id || 'U0000'

  const items = [
    {
      description: programName,
      qty: 1,
      rate: invoice.amount % 1 === 0 ? `$${invoice.amount}` : `$${invoice.amount.toFixed(2)}`,
      amount: invoice.amount,
    },
  ]

  const subtotal = invoice.amount

  // Helper function to format amount
  const formatAmount = (amount) => {
    const numAmount = typeof amount === 'number' ? amount : (parseFloat(amount) || 0)
    return numAmount.toFixed(2)
  }

  // Generate and download invoice PDF
  const handleDownloadInvoice = () => {
    // Use dynamic import to ensure autoTable is properly loaded
    import('jspdf-autotable').then(({ default: autoTable }) => {
      try {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        })
        
        // Invoice Header
        doc.setFontSize(20)
        doc.text("INVOICE", 105, 20, { align: "center" })
        
        // Invoice Details
        doc.setFontSize(10)
        doc.text(`Invoice ID: ${invoice.invoiceId}`, 20, 35)
        doc.text(`Booking Number: ${invoice.bookingId}`, 20, 42)
        doc.text(`Booking Date: ${bookingDate}`, 20, 49)
        
        // Student Information
        doc.setFontSize(12)
        doc.setFont(undefined, "bold")
        doc.text("Student Information", 20, 60)
        doc.setFont(undefined, "normal")
        doc.setFontSize(10)
        doc.text(`Student Name: ${invoice.user.name}`, 20, 68)
        doc.text(`Student ID: ${studentId}`, 20, 75)
        
        // Program Details
        doc.setFontSize(12)
        doc.setFont(undefined, "bold")
        doc.text("Program Details", 20, 85)
        doc.setFont(undefined, "normal")
        doc.setFontSize(10)
        
        const programDetails = [
          ["Program Name", programName],
          ["Mentor Name", mentorName],
          ["Start Date", startDate],
          ["End Date", endDate],
        ]
        
        // Use autoTable for program details
        autoTable(doc, {
          startY: 92,
          head: [],
          body: programDetails,
          theme: "plain",
          styles: { fontSize: 10 },
          columnStyles: {
            0: { fontStyle: "bold", cellWidth: 60 },
            1: { cellWidth: "auto" },
          },
          margin: { left: 20, right: 20 },
        })
        
        // Items Table
        let finalY = doc.lastAutoTable.finalY + 10
        doc.setFontSize(12)
        doc.setFont(undefined, "bold")
        doc.text("Items", 20, finalY)
        
        const itemsData = [
          ["Description", "Qty", "Rate", "Amount"],
          [programName, "1", `$${formatAmount(invoice.amount)}`, `$${formatAmount(invoice.amount)}`],
        ]
        
        autoTable(doc, {
          startY: finalY + 5,
          head: [itemsData[0]],
          body: [itemsData[1]],
          theme: "striped",
          headStyles: { fillColor: [61, 61, 61], textColor: 255, fontStyle: "bold" },
          styles: { fontSize: 10 },
          columnStyles: {
            0: { cellWidth: 90 },
            1: { cellWidth: 30, halign: "center" },
            2: { cellWidth: 30, halign: "right" },
            3: { cellWidth: 30, halign: "right" },
          },
          margin: { left: 20, right: 20 },
        })
        
        // Summary
        finalY = doc.lastAutoTable.finalY + 10
        doc.setFontSize(10)
        doc.setFont(undefined, "normal")
        doc.text(`Subtotal: $${formatAmount(subtotal)}`, 140, finalY, { align: "right" })
        finalY += 10
        doc.setFont(undefined, "bold")
        doc.setFontSize(12)
        doc.text(`Total Amount: $${formatAmount(subtotal)}`, 140, finalY, { align: "right" })
        
        // Footer
        finalY = finalY + 20
        doc.setFontSize(8)
        doc.setFont(undefined, "normal")
        doc.text("Thank you for your business!", 105, finalY, { align: "center" })
        
        // Save the PDF
        const fileName = `Invoice-${invoice.invoiceId.replace(/\s/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`
        doc.save(fileName)
      } catch (error) {
        console.error("Error generating PDF:", error)
        alert("Failed to generate invoice. Please try again.")
      }
    }).catch((error) => {
      console.error("Error loading jspdf-autotable:", error)
      alert("Failed to load PDF library. Please try again.")
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: InvoiceDetailsModalStyles.dialogPaper }}
    >
      <DialogTitle sx={InvoiceDetailsModalStyles.dialogTitle}>
        <Box>
          <Typography sx={InvoiceDetailsModalStyles.title}>Invoice Details</Typography>
          <Box sx={InvoiceDetailsModalStyles.subtitleRow}>
            <Typography sx={InvoiceDetailsModalStyles.subtitleLabel}>Invoice ID:</Typography>
            <Typography sx={InvoiceDetailsModalStyles.subtitleValue}>
              {invoice.invoiceId}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={InvoiceDetailsModalStyles.closeButton}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={InvoiceDetailsModalStyles.dialogContent}>
        <Box sx={InvoiceDetailsModalStyles.topInfoGrid}>
          <Box>
            <Typography sx={InvoiceDetailsModalStyles.sectionTitle}>Invoice Information</Typography>
            <Box sx={InvoiceDetailsModalStyles.infoList}>
              <Box sx={InvoiceDetailsModalStyles.infoRow}>
                <Typography sx={InvoiceDetailsModalStyles.infoLabel}>Booking Number</Typography>
                <Typography sx={InvoiceDetailsModalStyles.infoValue}>{invoice.bookingId}</Typography>
              </Box>
              <Box sx={InvoiceDetailsModalStyles.infoRow}>
                <Typography sx={InvoiceDetailsModalStyles.infoLabel}>Booking Date</Typography>
                <Typography sx={InvoiceDetailsModalStyles.infoValue}>{bookingDate}</Typography>
              </Box>
            </Box>
          </Box>

          <Box>
            <Typography sx={InvoiceDetailsModalStyles.sectionTitle}>Student Information</Typography>
            <Box sx={InvoiceDetailsModalStyles.infoList}>
              <Box sx={InvoiceDetailsModalStyles.infoRow}>
                <Typography sx={InvoiceDetailsModalStyles.infoLabel}>Student Name</Typography>
                <Typography sx={InvoiceDetailsModalStyles.infoValue}>{invoice.user.name}</Typography>
              </Box>
              <Box sx={InvoiceDetailsModalStyles.infoRow}>
                <Typography sx={InvoiceDetailsModalStyles.infoLabel}>Student ID</Typography>
                <Typography sx={InvoiceDetailsModalStyles.infoValue}>{studentId}</Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={InvoiceDetailsModalStyles.programSection}>
          <Typography sx={InvoiceDetailsModalStyles.sectionTitle}>Program Details</Typography>
          <Box sx={InvoiceDetailsModalStyles.programCard}>
            <Box sx={InvoiceDetailsModalStyles.programGrid}>
              <Box sx={InvoiceDetailsModalStyles.programItem}>
                <Typography sx={InvoiceDetailsModalStyles.programLabel}>Program Name</Typography>
                <Typography sx={InvoiceDetailsModalStyles.programValue}>{programName}</Typography>
              </Box>
              <Box sx={InvoiceDetailsModalStyles.programItem}>
                <Typography sx={InvoiceDetailsModalStyles.programLabel}>Mentor Name</Typography>
                <Typography sx={InvoiceDetailsModalStyles.programValue}>{mentorName}</Typography>
              </Box>
              <Box sx={InvoiceDetailsModalStyles.programItem}>
                <Typography sx={InvoiceDetailsModalStyles.programLabel}>Start Date</Typography>
                <Typography sx={InvoiceDetailsModalStyles.programValue}>{startDate}</Typography>
              </Box>
              <Box sx={InvoiceDetailsModalStyles.programItem}>
                <Typography sx={InvoiceDetailsModalStyles.programLabel}>End Date</Typography>
                <Typography sx={InvoiceDetailsModalStyles.programValue}>{endDate}</Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={InvoiceDetailsModalStyles.itemsSection}>
          <Typography sx={InvoiceDetailsModalStyles.sectionTitle}>Items</Typography>
          <TableContainer sx={InvoiceDetailsModalStyles.itemsCard}>
            <Table size="small">
              <TableHead sx={InvoiceDetailsModalStyles.itemsHeaderRow}>
                <TableRow>
                  <TableCell sx={InvoiceDetailsModalStyles.itemsHeaderCell}>Description</TableCell>
                  <TableCell sx={InvoiceDetailsModalStyles.itemsHeaderCell} align="right">
                    Qty
                  </TableCell>
                  <TableCell sx={InvoiceDetailsModalStyles.itemsHeaderCell} align="right">
                    Rate
                  </TableCell>
                  <TableCell sx={InvoiceDetailsModalStyles.itemsHeaderCell} align="right">
                    Amount
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={InvoiceDetailsModalStyles.itemsCell}>
                      {item.description}
                    </TableCell>
                    <TableCell sx={InvoiceDetailsModalStyles.itemsCell} align="right">
                      {item.qty}
                    </TableCell>
                    <TableCell sx={InvoiceDetailsModalStyles.itemsCell} align="right">
                      {item.rate}
                    </TableCell>
                    <TableCell sx={InvoiceDetailsModalStyles.itemsCell} align="right">
                      ${item.amount % 1 === 0 ? item.amount : item.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={InvoiceDetailsModalStyles.totals}>
            <Box sx={InvoiceDetailsModalStyles.totalRow}>
              <Typography sx={InvoiceDetailsModalStyles.totalLabel}>Subtotal</Typography>
              <Typography sx={InvoiceDetailsModalStyles.infoValue}>
                ${subtotal % 1 === 0 ? subtotal : subtotal.toFixed(2)}
              </Typography>
            </Box>
            <Box sx={{ ...InvoiceDetailsModalStyles.totalRow, borderBottom: 'none' }}>
              <Typography sx={InvoiceDetailsModalStyles.totalAmountLabel}>Total Amount</Typography>
              <Typography sx={InvoiceDetailsModalStyles.totalAmountValue}>
                ${subtotal % 1 === 0 ? subtotal : subtotal.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={InvoiceDetailsModalStyles.dialogActions}>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          sx={InvoiceDetailsModalStyles.downloadButton}
          onClick={handleDownloadInvoice}
        >
          Download
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default InvoiceDetailsModal



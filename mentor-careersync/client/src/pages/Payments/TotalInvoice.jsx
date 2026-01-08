import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Pagination,
} from '@mui/material'
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material'
import BookingSummaryCards from '../../components/UI/BookingSummaryCards/BookingSummaryCards'
import InvoiceDetailsModal from '../../components/Modals/InvoiceDetailsModal'
import { TotalInvoiceStyles } from './TotalInvoice.styles'
import { getMyInvoices } from '../../services/bookingApi'
import { CircularProgress, Alert } from '@mui/material'
import jsPDF from 'jspdf'

const statusColors = {
  Paid: { color: '#008236', bgColor: '#E8F5E9', border: '#C8E6C9' },
  Pending: { color: '#CA3500', bgColor: '#FFF3E0', border: '#FFD7A8' },
  Canceled: { color: '#B71C1C', bgColor: '#FFEBEE', border: '#FFCDD2' },
}

const splitDateTime = (dateTime) => {
  if (!dateTime) return { date: '', time: '' }
  const parts = String(dateTime).split(',')
  return {
    date: parts[0]?.trim() || String(dateTime),
    time: parts.slice(1).join(',').trim(),
  }
}

function TotalInvoice() {
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getMyInvoices()
        
        // Format invoices for display
        const formattedInvoices = data.map((invoice) => {
          const student = invoice.AccUser
          const payment = invoice.Payment
          
          // Format date/time from start_date_snapshot
          const sessionDate = invoice.start_date_snapshot 
            ? new Date(invoice.start_date_snapshot)
            : new Date(invoice.created_at)
          
          const dateStr = sessionDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
          const timeStr = sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
          
          // Get booking ID from Payment
          const bookingId = payment?.booking_id 
            ? `BK-${payment.booking_id.substring(0, 8).toUpperCase()}`
            : `INV-${invoice.id.substring(0, 8).toUpperCase()}`
          
          // All invoices show as Paid status
          let status = 'Paid'
          
          // Format dates for program details
          const startDate = invoice.start_date_snapshot
            ? new Date(invoice.start_date_snapshot).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'N/A'
          const endDate = invoice.end_date_snapshot
            ? new Date(invoice.end_date_snapshot).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'N/A'
          const bookingDate = invoice.created_at
            ? new Date(invoice.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : 'N/A'
          
          // Get student ID
          const studentId = student?.id 
            ? `U${student.id.substring(0, 4).toUpperCase()}`
            : 'U0000'
          
          return {
            id: invoice.id,
            invoiceId: `INV-${invoice.id.substring(0, 6).toUpperCase()}`,
            user: {
              name: student 
                ? `${student.first_name || ''} ${student.last_name || ''}`.trim() 
                : invoice.acc_user_name_snapshot || 'Student',
              email: student?.User?.email || '',
              initials: student 
                ? `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase()
                : (invoice.acc_user_name_snapshot || 'S').substring(0, 2).toUpperCase(),
              id: studentId
            },
            bookingId: bookingId,
            dateTime: `${dateStr}, ${timeStr}`,
            amount: parseFloat(invoice.total_amount || 0),
            status: status,
            // Program details from invoice snapshots
            programName: invoice.mentor_position_snapshot || 'Shadowing Program',
            mentorName: invoice.mentor_name_snapshot || 'Mentor',
            startDate: startDate,
            endDate: endDate,
            bookingDate: bookingDate,
            rawInvoice: invoice
          }
        })
        
        setInvoices(formattedInvoices)
      } catch (err) {
        console.error('Error fetching invoices:', err)
        setError(err.response?.data?.message || err.message || 'Failed to load invoices')
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [])

  // Calculate stats - all invoices are paid
  const stats = [
    { label: 'Total Invoices', value: invoices.length, color: '#1976d2' },
    { label: 'Paid', value: invoices.length, color: '#4caf50' },
    { label: 'Pending', value: 0, color: '#ff9800' },
  ]

  // Filter invoices based on search query
  const filteredInvoices = invoices.filter(invoice =>
    invoice.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.invoiceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.bookingId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Pagination
  const itemsPerPage = 10
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage)

  const handleMenuOpen = (event, invoice) => {
    setAnchorEl(event.currentTarget)
    setSelectedInvoice(invoice)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleView = (invoice) => {
    setSelectedInvoice(invoice)
    setDetailsOpen(true)
    handleMenuClose()
  }

  // Helper function to format amount
  const formatAmount = (amount) => {
    const numAmount = typeof amount === 'number' ? amount : (parseFloat(amount) || 0)
    return numAmount.toFixed(2)
  }

  // Generate and download invoice PDF
  const handleDownloadInvoice = (invoice) => {
    if (!invoice) return

    // Use dynamic import to ensure autoTable is properly loaded
    import('jspdf-autotable').then(({ default: autoTable }) => {
      try {
        const programName = invoice.programName || invoice.rawInvoice?.mentor_position_snapshot || 'Shadowing Program'
        const mentorName = invoice.mentorName || invoice.rawInvoice?.mentor_name_snapshot || 'Mentor'
        const startDate = invoice.startDate || 'N/A'
        const endDate = invoice.endDate || 'N/A'
        const bookingDate = invoice.bookingDate || 'N/A'
        const studentId = invoice.user?.id || 'U0000'
        const studentName = invoice.user?.name || 'Student'

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
        doc.text(`Student Name: ${studentName}`, 20, 68)
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
        doc.text(`Subtotal: $${formatAmount(invoice.amount)}`, 140, finalY, { align: "right" })
        finalY += 10
        doc.setFont(undefined, "bold")
        doc.setFontSize(12)
        doc.text(`Total Amount: $${formatAmount(invoice.amount)}`, 140, finalY, { align: "right" })
        
        // Footer
        finalY = finalY + 20
        doc.setFontSize(8)
        doc.setFont(undefined, "normal")
        doc.text("Thank you for your business!", 105, finalY, { align: "center" })
        
        // Save the PDF
        const fileName = `Invoice-${invoice.invoiceId.replace(/\s/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`
        doc.save(fileName)
        handleMenuClose()
      } catch (error) {
        console.error("Error generating PDF:", error)
        alert("Failed to generate invoice. Please try again.")
        handleMenuClose()
      }
    }).catch((error) => {
      console.error("Error loading jspdf-autotable:", error)
      alert("Failed to load PDF library. Please try again.")
      handleMenuClose()
    })
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  return (
    <Box sx={TotalInvoiceStyles.container}>
      <BookingSummaryCards stats={stats} />

      <Card sx={TotalInvoiceStyles.card}>
        <CardContent sx={TotalInvoiceStyles.content}>
          <Box sx={TotalInvoiceStyles.header}>
            <Typography variant="h6" sx={TotalInvoiceStyles.title}>
              All Invoices
            </Typography>
          </Box>

          <Box sx={TotalInvoiceStyles.toolbar}>
            <TextField
              placeholder="Search users..."
              size="small"
              sx={TotalInvoiceStyles.searchField}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={TotalInvoiceStyles.searchIcon} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 780, md: 'auto' } }}>
              <TableHead>
                <TableRow sx={TotalInvoiceStyles.headerRow}>
                  <TableCell sx={TotalInvoiceStyles.headerCell}>
                    Invoice ID
                  </TableCell>
                  <TableCell sx={TotalInvoiceStyles.headerCell}>User</TableCell>
                  <TableCell sx={TotalInvoiceStyles.headerCell}>
                    Booking ID
                  </TableCell>
                  <TableCell sx={TotalInvoiceStyles.headerCell}>
                    Date & Time
                  </TableCell>
                  <TableCell sx={TotalInvoiceStyles.headerCell}>Amount</TableCell>
                  <TableCell sx={TotalInvoiceStyles.headerCell}>Status</TableCell>
                  <TableCell sx={TotalInvoiceStyles.headerCell}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedInvoices.length > 0 ? (
                  paginatedInvoices.map((invoice) => (
                  <TableRow key={invoice.invoiceId} sx={TotalInvoiceStyles.tableRow}>
                    <TableCell>
                      <Typography sx={TotalInvoiceStyles.invoiceId}>
                        {invoice.invoiceId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={TotalInvoiceStyles.userCell}>
                        <Avatar sx={TotalInvoiceStyles.avatar}>
                          {invoice.user.initials}
                        </Avatar>
                        <Box>
                          <Typography sx={TotalInvoiceStyles.userName}>
                            {invoice.user.name}
                          </Typography>
                          <Typography sx={TotalInvoiceStyles.userEmail}>
                            {invoice.user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography sx={TotalInvoiceStyles.bookingId}>
                        {invoice.bookingId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const { date, time } = splitDateTime(invoice.dateTime)
                        return (
                          <Box sx={TotalInvoiceStyles.dateTimeCell}>
                            <Typography sx={TotalInvoiceStyles.dateText}>{date}</Typography>
                            <Typography sx={TotalInvoiceStyles.timeText}>{time}</Typography>
                          </Box>
                        )
                      })()}
                    </TableCell>
                    <TableCell>
                      <Typography sx={TotalInvoiceStyles.amount}>
                        ${invoice.amount % 1 === 0 ? invoice.amount : invoice.amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={invoice.status}
                        size="small"
                        sx={{
                          ...TotalInvoiceStyles.statusChip,
                          color: statusColors[invoice.status]?.color || '#666666',
                          backgroundColor: statusColors[invoice.status]?.bgColor || '#F5F5F5',
                          border: `1px solid ${statusColors[invoice.status]?.border || '#E0E0E0'}`,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={TotalInvoiceStyles.actionsCell}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleView(invoice)}
                          sx={TotalInvoiceStyles.viewButton}
                        >
                          View
                        </Button>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, invoice)}
                          sx={TotalInvoiceStyles.moreButton}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        {searchQuery ? 'No invoices found matching your search' : 'No invoices available'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={TotalInvoiceStyles.pagination}>
            <Typography variant="body2" sx={TotalInvoiceStyles.paginationText}>
              Showing {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} invoices
            </Typography>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(e, page) => setCurrentPage(page)}
              color="primary"
              shape="rounded"
            />
          </Box>
        </CardContent>
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        MenuListProps={{
          'aria-labelledby': 'invoice-actions-menu',
        }}
      >
        <MenuItem onClick={() => handleView(selectedInvoice)}>View Details</MenuItem>
        <MenuItem onClick={() => handleDownloadInvoice(selectedInvoice)}>Download PDF</MenuItem>
        <MenuItem onClick={handleMenuClose}>Send Email</MenuItem>
      </Menu>

      <InvoiceDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        invoice={selectedInvoice}
      />
    </Box>
  )
}

export default TotalInvoice
'use client'

import {
  Document, Page, Text, View, StyleSheet, Image, pdf,
} from '@react-pdf/renderer'
import { saveAs } from 'file-saver'

const C = {
  dark:   '#0F172A',
  navy:   '#1A3557',
  mid:    '#334155',
  muted:  '#64748B',
  light:  '#E2E8F0',
  faint:  '#F8FAFC',
  brand:  '#1A3557',
  paid:   '#15803D',
  partial:'#B45309',
  rule:   '#CBD5E1',
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.dark,
    backgroundColor: '#ffffff',
    paddingTop: 52,
    paddingBottom: 72,
    paddingHorizontal: 56,
  },

  /* ── Header band ── */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: C.navy,
    marginBottom: 22,
  },
  logoRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  logo:        { width: 32, height: 32, marginRight: 9, borderRadius: 4 },
  companyName: { fontFamily: 'Helvetica-Bold', fontSize: 14, color: C.navy },
  companyTag:  { fontSize: 8.5, color: C.muted, marginTop: 2 },
  companyAddr: { fontSize: 8, color: C.muted, lineHeight: 1.65, marginTop: 6 },

  docTitle:    { fontFamily: 'Helvetica-Bold', fontSize: 26, color: C.navy, letterSpacing: 1.5 },
  docSub:      { fontSize: 8, color: C.muted, textAlign: 'right', marginTop: 4, letterSpacing: 0.5 },

  /* ── Meta block (receipt no / date / issued by) ── */
  metaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: C.faint,
    borderWidth: 1,
    borderColor: C.light,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 22,
  },
  metaGroup:  { flexDirection: 'column', gap: 3 },
  metaLabel:  { fontSize: 7, color: C.muted, letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'Helvetica-Bold' },
  metaValue:  { fontSize: 9.5, color: C.dark, fontFamily: 'Helvetica-Bold', marginTop: 2 },

  /* ── Bill-to block ── */
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  billBlock: { flex: 1 },
  sectionLabel: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: C.muted, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 5 },
  billName: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.dark, marginBottom: 3 },
  billLine: { fontSize: 9, color: C.mid, lineHeight: 1.7 },

  serviceBlock: { flex: 1, alignItems: 'flex-end' },
  serviceLine:  { fontSize: 9, color: C.mid, lineHeight: 1.7, textAlign: 'right' },

  /* ── Line items ── */
  table: { marginBottom: 20 },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: C.navy,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 3,
    marginBottom: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.light,
  },
  tableRowAlt: { backgroundColor: C.faint },

  thDesc:   { flex: 1,   fontFamily: 'Helvetica-Bold', color: '#fff', fontSize: 8 },
  thPeriod: { width: 80, fontFamily: 'Helvetica-Bold', color: '#fff', fontSize: 8 },
  thAmt:    { width: 72, fontFamily: 'Helvetica-Bold', color: '#fff', fontSize: 8, textAlign: 'right' },

  tdDesc:   { flex: 1,   fontSize: 9, color: C.dark },
  tdPeriod: { width: 80, fontSize: 9, color: C.mid },
  tdAmt:    { width: 72, fontSize: 9, color: C.dark, textAlign: 'right' },

  /* ── Totals ── */
  totalsOuter: { alignSelf: 'flex-end', width: 230, marginBottom: 16 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.light,
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: C.navy,
    borderRadius: 3,
    marginTop: 3,
  },
  totalKey:      { fontSize: 8.5, color: C.muted },
  totalVal:      { fontSize: 8.5, color: C.dark },
  totalKeyFinal: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#fff' },
  totalValFinal: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#fff' },

  /* ── Payment method row ── */
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    alignSelf: 'flex-end',
    width: 230,
  },
  methodLabel: { fontSize: 8, color: C.muted },
  methodValue: { fontSize: 8.5, color: C.dark, fontFamily: 'Helvetica-Bold' },

  /* ── Status stamp ── */
  stampRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  stamp: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 3,
    borderWidth: 2,
  },
  stampText: { fontFamily: 'Helvetica-Bold', fontSize: 12, letterSpacing: 1 },

  /* ── Note ── */
  noteBox: {
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: C.faint,
    borderRadius: 3,
    borderLeftWidth: 3,
    borderLeftColor: C.rule,
    marginBottom: 10,
  },
  noteLabel: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: C.muted, marginBottom: 3, letterSpacing: 1, textTransform: 'uppercase' },
  noteText:  { fontSize: 8.5, color: C.mid, fontFamily: 'Helvetica-Oblique' },

  /* ── Footer ── */
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 56,
    right: 56,
    borderTopWidth: 1,
    borderTopColor: C.light,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerLeft:  { fontSize: 7.5, color: C.muted, lineHeight: 1.65 },
  footerRight: { fontSize: 7.5, color: C.muted, textAlign: 'right', lineHeight: 1.65 },
})

export type ReceiptProps = {
  studentName:   string
  tier:          string
  branch:        string
  subject:       string
  status:        'paid' | 'partial'
  note:          string | null
  amount:        string
  paymentMethod: string
  servicePeriod: string
  teacherName:   string
  receiptDate:   string
  receiptNumber: string
  logoUrl:       string
}

function ReceiptDocument(props: ReceiptProps) {
  const {
    studentName, tier, branch, subject, status, note,
    amount, paymentMethod, servicePeriod,
    teacherName, receiptDate, receiptNumber, logoUrl,
  } = props

  const isPaid      = status === 'paid'
  const stampColor  = isPaid ? C.paid : C.partial
  const stampLabel  = isPaid ? 'PAID IN FULL' : 'PARTIAL PAYMENT'
  const amountNum   = parseFloat(amount) || 0
  const amountStr   = `RM ${amountNum.toFixed(2)}`
  const descLine    = `${subject} Tuition Fee${tier && tier !== subject ? ` — ${tier}` : ''}${branch ? ` (${branch})` : ''}`

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <View style={styles.logoRow}>
              <Image src={logoUrl} style={styles.logo} />
              <View>
                <Text style={styles.companyName}>Triple Tree Enrichment Centre</Text>
                <Text style={styles.companyTag}>Enrichment · Education · Excellence</Text>
              </View>
            </View>
            <Text style={styles.companyAddr}>
              Kuala Lumpur, Malaysia{'\n'}
              enquiries@tripletree.edu.my
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.docTitle}>RECEIPT</Text>
            <Text style={styles.docSub}>OFFICIAL PAYMENT RECEIPT</Text>
          </View>
        </View>

        {/* ── Meta bar ── */}
        <View style={styles.metaBar}>
          <View style={styles.metaGroup}>
            <Text style={styles.metaLabel}>Receipt No.</Text>
            <Text style={styles.metaValue}>{receiptNumber}</Text>
          </View>
          <View style={styles.metaGroup}>
            <Text style={styles.metaLabel}>Date of Issue</Text>
            <Text style={styles.metaValue}>{receiptDate}</Text>
          </View>
          <View style={styles.metaGroup}>
            <Text style={styles.metaLabel}>Service Period</Text>
            <Text style={styles.metaValue}>{servicePeriod || '—'}</Text>
          </View>
          <View style={styles.metaGroup}>
            <Text style={styles.metaLabel}>Received By</Text>
            <Text style={styles.metaValue}>{teacherName}</Text>
          </View>
        </View>

        {/* ── Bill to / Class details ── */}
        <View style={styles.billRow}>
          <View style={styles.billBlock}>
            <Text style={styles.sectionLabel}>Received From</Text>
            <Text style={styles.billName}>{studentName}</Text>
            <Text style={styles.billLine}>{subject}</Text>
            {tier && tier !== subject && <Text style={styles.billLine}>{tier}</Text>}
            <Text style={styles.billLine}>{branch}</Text>
          </View>
          <View style={styles.serviceBlock}>
            <Text style={styles.sectionLabel}>Payment Method</Text>
            <Text style={[styles.serviceLine, { fontFamily: 'Helvetica-Bold', color: C.dark }]}>
              {paymentMethod || 'Cash'}
            </Text>
          </View>
        </View>

        {/* ── Line items ── */}
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={styles.thDesc}>Description</Text>
            <Text style={styles.thPeriod}>Period</Text>
            <Text style={styles.thAmt}>Amount (RM)</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tdDesc}>{descLine}</Text>
            <Text style={styles.tdPeriod}>{servicePeriod || '—'}</Text>
            <Text style={styles.tdAmt}>{amountNum.toFixed(2)}</Text>
          </View>
          {[1, 2].map(i => (
            <View key={i} style={[styles.tableRow, i % 2 === 0 ? styles.tableRowAlt : {}]}>
              <Text style={styles.tdDesc}> </Text>
              <Text style={styles.tdPeriod}> </Text>
              <Text style={styles.tdAmt}> </Text>
            </View>
          ))}
        </View>

        {/* ── Totals ── */}
        <View style={styles.totalsOuter}>
          <View style={styles.totalRow}>
            <Text style={styles.totalKey}>Subtotal</Text>
            <Text style={styles.totalVal}>{amountStr}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalKey}>SST (Exempt)</Text>
            <Text style={styles.totalVal}>—</Text>
          </View>
          <View style={styles.totalRowFinal}>
            <Text style={styles.totalKeyFinal}>Total Received</Text>
            <Text style={styles.totalValFinal}>{amountStr}</Text>
          </View>
        </View>

        {/* ── Status stamp ── */}
        <View style={styles.stampRow}>
          <View style={[styles.stamp, { borderColor: stampColor }]}>
            <Text style={[styles.stampText, { color: stampColor }]}>{stampLabel}</Text>
          </View>
        </View>

        {note && (
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>Remarks</Text>
            <Text style={styles.noteText}>{note}</Text>
          </View>
        )}

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerLeft}>
            Triple Tree Enrichment Centre{'\n'}
            This is a computer-generated official receipt. No signature required.
          </Text>
          <Text style={styles.footerRight}>
            {receiptNumber}{'\n'}
            {receiptDate}
          </Text>
        </View>

      </Page>
    </Document>
  )
}

export async function downloadReceipt(props: Omit<ReceiptProps, 'logoUrl'>) {
  const logoUrl = `${window.location.origin}/logo.png`
  const blob = await pdf(<ReceiptDocument {...props} logoUrl={logoUrl} />).toBlob()
  saveAs(blob, `receipt-${props.receiptNumber.replace(/\//g, '-')}-${props.studentName.replace(/\s+/g, '-')}.pdf`)
}

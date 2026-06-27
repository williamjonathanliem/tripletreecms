'use client'

import {
  Document, Page, Text, View, StyleSheet, Image, pdf,
} from '@react-pdf/renderer'
import { saveAs } from 'file-saver'

const C = {
  dark:   '#111827',
  mid:    '#374151',
  muted:  '#6B7280',
  light:  '#E5E7EB',
  faint:  '#F9FAFB',
  brand:  '#1A5276',
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.dark,
    backgroundColor: '#ffffff',
    paddingTop: 48,
    paddingBottom: 64,
    paddingHorizontal: 52,
  },

  /* ── Top row: FROM left / RECEIPT right ── */
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  fromBlock: { flexDirection: 'column', gap: 2 },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  logo: { width: 28, height: 28, marginRight: 7, borderRadius: 4 },
  companyName: { fontFamily: 'Helvetica-Bold', fontSize: 13, color: C.brand },
  fromLabel: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  fromLine: { fontSize: 9, color: C.mid, lineHeight: 1.6 },

  receiptTitle: { fontFamily: 'Helvetica-Bold', fontSize: 36, color: C.dark, letterSpacing: -0.5 },

  /* ── TO / meta row ── */
  midRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  toBlock: {},
  toLabel: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 5 },
  toName: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.dark, marginBottom: 2 },
  toLine: { fontSize: 9, color: C.mid, lineHeight: 1.6 },

  metaTable: {},
  metaRow: { flexDirection: 'row', marginBottom: 4 },
  metaKey: { fontFamily: 'Helvetica-Bold', fontSize: 9, width: 90, color: C.mid },
  metaVal: { fontSize: 9, color: C.dark },

  /* ── Line items table ── */
  table: { marginBottom: 24 },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: C.dark,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.light,
  },
  tableRowAlt: { backgroundColor: C.faint },
  thQty:  { width: 36,  fontFamily: 'Helvetica-Bold', color: '#fff', fontSize: 8 },
  thDesc: { flex: 1,    fontFamily: 'Helvetica-Bold', color: '#fff', fontSize: 8 },
  thAmt:  { width: 72,  fontFamily: 'Helvetica-Bold', color: '#fff', fontSize: 8, textAlign: 'right' },
  tdQty:  { width: 36,  fontSize: 9, color: C.mid },
  tdDesc: { flex: 1,    fontSize: 9, color: C.dark },
  tdAmt:  { width: 72,  fontSize: 9, color: C.dark, textAlign: 'right' },

  /* ── Totals ── */
  totalsBlock: { alignSelf: 'flex-end', width: 220 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.light,
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: C.dark,
    borderRadius: 4,
    marginTop: 2,
  },
  totalKey:      { fontSize: 9, color: C.mid },
  totalVal:      { fontSize: 9, color: C.dark },
  totalKeyFinal: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#fff' },
  totalValFinal: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#fff' },

  /* ── Status stamp ── */
  stampRow: { flexDirection: 'row', marginTop: 20, gap: 8, alignItems: 'center' },
  stamp: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 2,
  },
  stampText: { fontFamily: 'Helvetica-Bold', fontSize: 11, letterSpacing: 0.5 },

  /* ── Note ── */
  noteBox: {
    marginTop: 16,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: C.faint,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: C.light,
  },
  noteLabel: { fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: C.muted, marginBottom: 3, letterSpacing: 1, textTransform: 'uppercase' },
  noteText:  { fontSize: 9, color: C.mid, fontFamily: 'Helvetica-Oblique' },

  /* ── Footer ── */
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 52,
    right: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: C.light,
    paddingTop: 10,
  },
  footerText: { fontSize: 7.5, color: C.muted },
})

export type ReceiptProps = {
  studentName: string
  tier: string
  branch: string
  subject: string
  status: 'paid' | 'partial'
  note: string | null
  amount: string
  teacherName: string
  receiptDate: string
  receiptNumber: string
  logoUrl: string
}

function ReceiptDocument(props: ReceiptProps) {
  const {
    studentName, tier, branch, subject, status, note,
    amount, teacherName, receiptDate, receiptNumber, logoUrl,
  } = props

  const isPaid = status === 'paid'
  const stampColor = isPaid ? '#1E8449' : '#B7770D'
  const stampLabel = isPaid ? 'PAID' : 'PARTIAL PAYMENT'
  const amountDisplay = amount ? `RM ${parseFloat(amount).toFixed(2)}` : '—'

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ── Top row ── */}
        <View style={styles.topRow}>
          <View style={styles.fromBlock}>
            <Text style={styles.fromLabel}>From</Text>
            <View style={styles.logoRow}>
              <Image src={logoUrl} style={styles.logo} />
              <Text style={styles.companyName}>Triple Tree Coding</Text>
            </View>
            <Text style={styles.fromLine}>Enrichment Centre</Text>
            <Text style={styles.fromLine}>Malaysia</Text>
          </View>
          <Text style={styles.receiptTitle}>RECEIPT</Text>
        </View>

        {/* ── TO / meta row ── */}
        <View style={styles.midRow}>
          <View style={styles.toBlock}>
            <Text style={styles.toLabel}>To</Text>
            <Text style={styles.toName}>{studentName}</Text>
            <Text style={styles.toLine}>{subject}</Text>
            {tier !== subject && <Text style={styles.toLine}>{tier}</Text>}
            <Text style={styles.toLine}>{branch}</Text>
          </View>
          <View style={styles.metaTable}>
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>Receipt #:</Text>
              <Text style={styles.metaVal}>{receiptNumber}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>Receipt Date:</Text>
              <Text style={styles.metaVal}>{receiptDate}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>Issued By:</Text>
              <Text style={styles.metaVal}>{teacherName}</Text>
            </View>
          </View>
        </View>

        {/* ── Line items table ── */}
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={styles.thQty}>QTY</Text>
            <Text style={styles.thDesc}>Description</Text>
            <Text style={styles.thAmt}>Amount</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tdQty}>1</Text>
            <Text style={styles.tdDesc}>
              {subject} Tuition Fee{tier && tier !== subject ? ` — ${tier}` : ''}{branch ? ` (${branch})` : ''}
            </Text>
            <Text style={styles.tdAmt}>{amountDisplay}</Text>
          </View>
          {/* empty rows for visual padding */}
          {[1, 2, 3].map(i => (
            <View key={i} style={[styles.tableRow, i % 2 === 0 ? styles.tableRowAlt : {}]}>
              <Text style={styles.tdQty}> </Text>
              <Text style={styles.tdDesc}> </Text>
              <Text style={styles.tdAmt}> </Text>
            </View>
          ))}
        </View>

        {/* ── Totals ── */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalKey}>Subtotal</Text>
            <Text style={styles.totalVal}>{amountDisplay}</Text>
          </View>
          <View style={styles.totalRowFinal}>
            <Text style={styles.totalKeyFinal}>Total</Text>
            <Text style={styles.totalValFinal}>{amountDisplay}</Text>
          </View>
        </View>

        {/* ── Status stamp + note ── */}
        <View style={styles.stampRow}>
          <View style={[styles.stamp, { borderColor: stampColor }]}>
            <Text style={[styles.stampText, { color: stampColor }]}>{stampLabel}</Text>
          </View>
        </View>

        {note && (
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>Note</Text>
            <Text style={styles.noteText}>{note}</Text>
          </View>
        )}

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Triple Tree Coding</Text>
          <Text style={styles.footerText}>This is a computer-generated receipt.</Text>
          <Text style={styles.footerText}>{receiptDate}</Text>
        </View>

      </Page>
    </Document>
  )
}

export async function downloadReceipt(props: Omit<ReceiptProps, 'logoUrl'>) {
  const logoUrl = `${window.location.origin}/logo.png`
  const blob = await pdf(<ReceiptDocument {...props} logoUrl={logoUrl} />).toBlob()
  saveAs(blob, `receipt-${props.studentName.replace(/\s+/g, '-')}-${props.receiptNumber}.pdf`)
}

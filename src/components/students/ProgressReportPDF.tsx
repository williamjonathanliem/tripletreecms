'use client'

import { Document, Page, Text, View, StyleSheet, Image, pdf } from '@react-pdf/renderer'
import { saveAs } from 'file-saver'

const C = {
  brand:  '#1A5276',
  accent: '#2E86C1',
  dark:   '#111827',
  mid:    '#374151',
  muted:  '#6B7280',
  light:  '#E5E7EB',
  faint:  '#F9FAFB',
  green:  '#15803d',
  red:    '#b91c1c',
  amber:  '#b45309',
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.dark,
    backgroundColor: '#ffffff',
    paddingTop: 0,
    paddingBottom: 48,
    paddingHorizontal: 0,
  },
  header: {
    backgroundColor: C.brand,
    paddingTop: 36,
    paddingBottom: 28,
    paddingHorizontal: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerLeft: { flexDirection: 'column', gap: 4 },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logo: { width: 32, height: 32, marginRight: 8, borderRadius: 6 },
  companyName: { fontFamily: 'Helvetica-Bold', fontSize: 15, color: '#ffffff' },
  reportTitle: { fontFamily: 'Helvetica-Bold', fontSize: 22, color: 'rgba(255,255,255,0.9)' },
  reportSub: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  headerRight: { alignItems: 'flex-end' },
  headerDate: { fontSize: 9, color: 'rgba(255,255,255,0.5)' },
  headerStudent: { fontFamily: 'Helvetica-Bold', fontSize: 13, color: '#ffffff', marginTop: 2 },

  body: { paddingHorizontal: 48, paddingTop: 28 },

  // Section
  section: { marginBottom: 22 },
  sectionLabel: {
    fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: C.muted,
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8,
    paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: C.light,
  },

  // Info grid
  infoGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  infoCell: {
    flex: 1, minWidth: 100,
    backgroundColor: C.faint, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  infoCellKey: { fontSize: 7.5, color: C.muted, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.8 },
  infoCellVal: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: C.dark },

  // Progress bar
  progressBarBg: { height: 8, backgroundColor: C.light, borderRadius: 4, marginBottom: 4 },
  progressBarFill: { height: 8, borderRadius: 4 },

  // Module list
  moduleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: C.faint,
  },
  moduleDot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  moduleDotText: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: '#ffffff' },
  moduleName: { flex: 1, fontSize: 9 },
  moduleStatus: { fontSize: 8, fontFamily: 'Helvetica-Bold' },

  // Attendance stats
  attRow: { flexDirection: 'row', gap: 8 },
  attCard: {
    flex: 1, backgroundColor: C.faint, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center',
  },
  attNum: { fontFamily: 'Helvetica-Bold', fontSize: 20 },
  attLabel: { fontSize: 7.5, color: C.muted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.8 },

  // Fee
  feeBox: {
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  feeLabel: { fontFamily: 'Helvetica-Bold', fontSize: 11 },
  feeSub: { fontSize: 8, marginTop: 2 },

  // Footer
  footer: {
    position: 'absolute', bottom: 20, left: 48, right: 48,
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: C.light, paddingTop: 8,
  },
  footerText: { fontSize: 7.5, color: C.muted },
})

export type ProgressReportProps = {
  studentName: string
  age: number
  tier: string
  branch: string
  subject: string
  teacherName: string
  enrolledDate: string
  moduleCurrent: number
  moduleTotal: number
  modules: string[]
  attendancePresent: number
  attendanceTotal: number
  feeStatus: 'paid' | 'unpaid' | 'partial'
  feeNote?: string | null
  generatedDate: string
  logoUrl: string
}

const FEE_META = {
  paid:    { label: 'Paid',    sub: 'Fees are up to date',     color: C.green, bg: '#f0fdf4' },
  unpaid:  { label: 'Unpaid',  sub: 'Payment outstanding',     color: C.red,   bg: '#fef2f2' },
  partial: { label: 'Partial', sub: 'Partial payment received', color: C.amber, bg: '#fffbeb' },
}

function ProgressReportDocument(props: ProgressReportProps) {
  const {
    studentName, age, tier, branch, subject, teacherName,
    enrolledDate, moduleCurrent, moduleTotal, modules,
    attendancePresent, attendanceTotal, feeStatus, feeNote,
    generatedDate, logoUrl,
  } = props

  const pct = moduleTotal > 0 ? Math.round((moduleCurrent / moduleTotal) * 100) : 0
  const attPct = attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : 0
  const feeMeta = FEE_META[feeStatus]

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoRow}>
              <Image src={logoUrl} style={styles.logo} />
              <Text style={styles.companyName}>Triple Tree</Text>
            </View>
            <Text style={styles.reportTitle}>Progress Report</Text>
            <Text style={styles.reportSub}>Enrichment Centre · Student Summary</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerDate}>Generated {generatedDate}</Text>
            <Text style={styles.headerStudent}>{studentName}</Text>
          </View>
        </View>

        <View style={styles.body}>

          {/* Student info */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Student Information</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoCell}>
                <Text style={styles.infoCellKey}>Name</Text>
                <Text style={styles.infoCellVal}>{studentName}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoCellKey}>Age</Text>
                <Text style={styles.infoCellVal}>{age} years</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoCellKey}>Tier</Text>
                <Text style={styles.infoCellVal}>{tier}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoCellKey}>Branch</Text>
                <Text style={styles.infoCellVal}>{branch}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoCellKey}>Subject</Text>
                <Text style={styles.infoCellVal}>{subject}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoCellKey}>Teacher</Text>
                <Text style={styles.infoCellVal}>{teacherName}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoCellKey}>Enrolled</Text>
                <Text style={styles.infoCellVal}>{enrolledDate}</Text>
              </View>
            </View>
          </View>

          {/* Curriculum Progress */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Curriculum Progress — {pct}% Complete</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: C.brand }]} />
            </View>
            <Text style={{ fontSize: 8, color: C.muted, marginBottom: 10 }}>
              Module {moduleCurrent} of {moduleTotal} · {pct}% complete
            </Text>

            {modules.map((mod, idx) => {
              const done = idx < moduleCurrent
              const current = idx === moduleCurrent
              return (
                <View key={idx} style={styles.moduleRow}>
                  <View style={[styles.moduleDot, {
                    backgroundColor: done ? C.green : current ? C.brand : C.light,
                  }]}>
                    <Text style={styles.moduleDotText}>{done ? '✓' : String(idx + 1)}</Text>
                  </View>
                  <Text style={[styles.moduleName, {
                    color: done ? C.muted : current ? C.brand : C.mid,
                    fontFamily: current ? 'Helvetica-Bold' : 'Helvetica',
                    textDecoration: done ? 'line-through' : undefined,
                  }]}>
                    {mod}
                  </Text>
                  {current && (
                    <Text style={[styles.moduleStatus, { color: C.brand }]}>IN PROGRESS</Text>
                  )}
                  {done && (
                    <Text style={[styles.moduleStatus, { color: C.green }]}>DONE</Text>
                  )}
                </View>
              )
            })}
          </View>

          {/* Attendance */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Attendance Summary</Text>
            <View style={styles.attRow}>
              <View style={styles.attCard}>
                <Text style={[styles.attNum, { color: C.brand }]}>{attPct}%</Text>
                <Text style={styles.attLabel}>Attendance Rate</Text>
              </View>
              <View style={styles.attCard}>
                <Text style={[styles.attNum, { color: C.green }]}>{attendancePresent}</Text>
                <Text style={styles.attLabel}>Sessions Present</Text>
              </View>
              <View style={styles.attCard}>
                <Text style={[styles.attNum, { color: C.mid }]}>{attendanceTotal}</Text>
                <Text style={styles.attLabel}>Total Sessions</Text>
              </View>
              <View style={styles.attCard}>
                <Text style={[styles.attNum, { color: C.red }]}>{attendanceTotal - attendancePresent}</Text>
                <Text style={styles.attLabel}>Missed</Text>
              </View>
            </View>
          </View>

          {/* Fee Status */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Fee Status</Text>
            <View style={[styles.feeBox, { backgroundColor: feeMeta.bg }]}>
              <View>
                <Text style={[styles.feeLabel, { color: feeMeta.color }]}>{feeMeta.label}</Text>
                <Text style={[styles.feeSub, { color: feeMeta.color }]}>{feeMeta.sub}</Text>
                {feeNote && (
                  <Text style={[styles.feeSub, { marginTop: 4, fontFamily: 'Helvetica-Oblique' }]}>
                    Note: {feeNote}
                  </Text>
                )}
              </View>
            </View>
          </View>

        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Triple Tree Enrichment</Text>
          <Text style={styles.footerText}>Confidential · For parent/guardian use only</Text>
          <Text style={styles.footerText}>{generatedDate}</Text>
        </View>

      </Page>
    </Document>
  )
}

export async function downloadProgressReport(props: Omit<ProgressReportProps, 'logoUrl'>) {
  const logoUrl = `${window.location.origin}/logo.png`
  const blob = await pdf(<ProgressReportDocument {...props} logoUrl={logoUrl} />).toBlob()
  const safeName = props.studentName.replace(/\s+/g, '-')
  saveAs(blob, `progress-report-${safeName}-${props.generatedDate.replace(/\s/g, '-')}.pdf`)
}

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#000',
  },
  header: {
    marginBottom: 20,
    borderBottom: '1pt solid #E85D9A',
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A1B3C',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  disclaimer: {
    fontSize: 9,
    color: '#999',
    marginTop: 5,
    fontStyle: 'italic',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E85D9A',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#eee',
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#eee',
    backgroundColor: '#FDF8F9',
    padding: 5,
  },
  tableCol: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#eee',
    padding: 5,
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4A1B3C',
  },
  tableCell: {
    fontSize: 9,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  statBox: {
    width: '33%',
    padding: 10,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4A1B3C',
  },
  insight: {
    marginBottom: 10,
    paddingLeft: 10,
    borderLeft: '2pt solid #E85D9A',
  },
  insightTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4A1B3C',
  },
  insightBody: {
    fontSize: 10,
    color: '#444',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTop: '1pt solid #eee',
    paddingTop: 10,
    fontSize: 9,
    color: '#666',
  }
});

interface CycleReportProps {
  userName: string;
  monthName: string;
  year: number;
  generatedAt: string;
  cycles: any[];
  logs: any[];
  stats: {
    avgCycleLength: number;
    avgPeriodLength: number;
    topSymptoms: string[];
    topMood: string;
    streak: number;
  };
  insights: any[];
}

export const CycleReportTemplate = ({ 
  userName, 
  monthName, 
  year, 
  generatedAt, 
  cycles, 
  logs, 
  stats, 
  insights 
}: CycleReportProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Luna Cycle Report</Text>
        <Text style={styles.headerSubtitle}>{monthName} {year} · {userName}</Text>
        <Text style={styles.headerSubtitle}>Generated on {generatedAt}</Text>
        <Text style={styles.disclaimer}>This report is for personal reference. Consult a healthcare professional for medical decisions.</Text>
      </View>

      {/* SECTION 1: CYCLE SUMMARY */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cycle Summary</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Start</Text></View>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>End</Text></View>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Length</Text></View>
            <View style={[styles.tableColHeader, { width: '15%' }]}><Text style={styles.tableCellHeader}>Flow</Text></View>
            <View style={[styles.tableColHeader, { width: '25%' }]}><Text style={styles.tableCellHeader}>Notes</Text></View>
          </View>
          {cycles.map((c, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{c.period_start}</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{c.period_end || '-'}</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{c.cycle_length ? `${c.cycle_length} days` : '-'}</Text></View>
              <View style={[styles.tableCol, { width: '15%' }]}><Text style={styles.tableCell}>{c.avg_flow || '-'}</Text></View>
              <View style={[styles.tableCol, { width: '25%' }]}><Text style={styles.tableCell}>{c.notes || ''}</Text></View>
            </View>
          ))}
          {cycles.length === 0 && (
            <View style={styles.tableRow}><View style={[styles.tableCol, { width: '100%' }]}><Text style={styles.tableCell}>No cycle data for this period.</Text></View></View>
          )}
        </View>
      </View>

      {/* SECTION 2: DAILY LOGS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Symptom Log (Last 30 Days)</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableColHeader, { width: '15%' }]}><Text style={styles.tableCellHeader}>Date</Text></View>
            <View style={[styles.tableColHeader, { width: '10%' }]}><Text style={styles.tableCellHeader}>Mood</Text></View>
            <View style={[styles.tableColHeader, { width: '10%' }]}><Text style={styles.tableCellHeader}>Energy</Text></View>
            <View style={[styles.tableColHeader, { width: '10%' }]}><Text style={styles.tableCellHeader}>Flow</Text></View>
            <View style={[styles.tableColHeader, { width: '30%' }]}><Text style={styles.tableCellHeader}>Symptoms</Text></View>
            <View style={[styles.tableColHeader, { width: '25%' }]}><Text style={styles.tableCellHeader}>Notes</Text></View>
          </View>
          {logs.map((l, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={[styles.tableCol, { width: '15%' }]}><Text style={styles.tableCell}>{l.log_date}</Text></View>
              <View style={[styles.tableCol, { width: '10%' }]}><Text style={styles.tableCell}>{l.mood || '-'}</Text></View>
              <View style={[styles.tableCol, { width: '10%' }]}><Text style={styles.tableCell}>{l.energy || '-'}</Text></View>
              <View style={[styles.tableCol, { width: '10%' }]}><Text style={styles.tableCell}>{l.flow || '-'}</Text></View>
              <View style={[styles.tableCol, { width: '30%' }]}><Text style={styles.tableCell}>{l.symptoms?.join(', ') || '-'}</Text></View>
              <View style={[styles.tableCol, { width: '25%' }]}><Text style={styles.tableCell}>{l.notes || ''}</Text></View>
            </View>
          ))}
          {logs.length === 0 && (
            <View style={styles.tableRow}><View style={[styles.tableCol, { width: '100%' }]}><Text style={styles.tableCell}>No log entries for this period.</Text></View></View>
          )}
        </View>
      </View>

      {/* SECTION 3: KEY STATS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Health Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Avg Cycle Length</Text>
            <Text style={styles.statValue}>{stats.avgCycleLength} Days</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Avg Period Length</Text>
            <Text style={styles.statValue}>{stats.avgPeriodLength} Days</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Current Streak</Text>
            <Text style={styles.statValue}>{stats.streak} Days</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Top Symptoms</Text>
            <Text style={styles.statValue}>{stats.topSymptoms.join(', ') || 'None'}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Primary Mood</Text>
            <Text style={styles.statValue}>{stats.topMood || 'None'}</Text>
          </View>
        </View>
      </View>

      {/* SECTION 4: AI INSIGHTS */}
      <View style={styles.section} wrap={false}>
        <Text style={styles.sectionTitle}>Cycle Insights</Text>
        {insights.map((ins, i) => (
          <View key={i} style={styles.insight}>
            <Text style={styles.insightTitle}>{ins.title}</Text>
            <Text style={styles.insightBody}>{ins.body}</Text>
          </View>
        ))}
        {insights.length === 0 && (
          <Text style={styles.insightBody}>No recent insights available.</Text>
        )}
      </View>

      {/* FOOTER */}
      <Text style={styles.footer}>
        Generated by Luna · lunawellness.app · Your data, your health.
      </Text>
    </Page>
  </Document>
);

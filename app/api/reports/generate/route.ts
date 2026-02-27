import { NextRequest, NextResponse } from 'next/server';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportType, dateFrom, dateTo, format = 'csv', tenantId } = body;

    if (!reportType || !dateFrom || !dateTo) {
      return addCorsHeaders(NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      ));
    }

    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate mock report data based on type
    let reportData: any = {};

    switch (reportType) {
      case 'collection':
        reportData = {
          summary: {
            totalExpected: 3500000,
            totalCollected: 3290000,
            totalPending: 210000,
            collectionRate: 94.0,
            transactions: 1247,
          },
          daily: generateDailyData(dateFrom, dateTo),
          topCollectors: [
            { name: 'Rajesh Kumar', amount: 125000, transactions: 45 },
            { name: 'Priya Sharma', amount: 98000, transactions: 38 },
            { name: 'Amit Patel', amount: 87000, transactions: 35 },
          ],
        };
        break;

      case 'loan':
        reportData = {
          summary: {
            totalLoans: 2847,
            totalDisbursed: 142350000,
            totalOutstanding: 85410000,
            averageLoanSize: 50000,
          },
          byStatus: {
            active: 2145,
            completed: 589,
            defaulted: 113,
          },
          byType: {
            daily: 1523,
            weekly: 892,
            monthly: 432,
          },
        };
        break;

      case 'agent':
        reportData = {
          summary: {
            totalAgents: 25,
            activeAgents: 22,
            avgCollectionRate: 92.5,
            totalCustomers: 1250,
          },
          performance: [
            { name: 'Rajesh Kumar', collections: 125000, customers: 45, efficiency: 96 },
            { name: 'Priya Sharma', collections: 98000, customers: 38, efficiency: 92 },
            { name: 'Amit Patel', collections: 87000, customers: 35, efficiency: 89 },
            { name: 'Sneha Reddy', collections: 76000, customers: 32, efficiency: 87 },
            { name: 'Vikram Singh', collections: 65000, customers: 28, efficiency: 85 },
          ],
        };
        break;

      case 'customer':
        reportData = {
          summary: {
            totalCustomers: 3926,
            activeCustomers: 2847,
            newCustomers: 156,
            avgLoanSize: 48500,
          },
          demographics: {
            byAge: {
              '18-25': 234,
              '26-35': 1456,
              '36-45': 1234,
              '46-60': 892,
              '60+': 110,
            },
            byGender: {
              male: 2345,
              female: 1581,
            },
          },
          behavior: {
            excellentPayers: 2456,
            goodPayers: 1123,
            averagePayers: 234,
            poorPayers: 113,
          },
        };
        break;

      case 'risk':
        reportData = {
          summary: {
            totalRisk: 8541000,
            highRisk: 2134000,
            mediumRisk: 4567000,
            lowRisk: 1840000,
          },
          defaultRate: 3.97,
          overdueLoans: 113,
          predictions: {
            next30Days: {
              likelyDefaults: 23,
              estimatedLoss: 1150000,
            },
          },
        };
        break;

      default:
        reportData = {
          error: 'Unknown report type',
        };
    }

    // Generate CSV or JSON based on format
    let fileContent: string;
    let mimeType: string;
    let fileExtension: string;

    if (format === 'csv') {
      fileContent = generateCSV(reportData, reportType);
      mimeType = 'text/csv';
      fileExtension = 'csv';
    } else {
      fileContent = JSON.stringify(reportData, null, 2);
      mimeType = 'application/json';
      fileExtension = 'json';
    }

    const fileName = `${reportType}-report-${dateFrom}-to-${dateTo}.${fileExtension}`;

    return addCorsHeaders(NextResponse.json({
      success: true,
      data: {
        reportId: `RPT${Date.now()}`,
        fileName,
        fileContent,
        mimeType,
        generatedAt: new Date().toISOString(),
        reportType,
        dateRange: { from: dateFrom, to: dateTo },
      },
    }));
  } catch (error: any) {
    return addCorsHeaders(NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    ));
  }
}

function generateDailyData(from: string, to: string) {
  const start = new Date(from);
  const end = new Date(to);
  const days = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push({
      date: d.toISOString().split('T')[0],
      expected: Math.floor(Math.random() * 50000) + 100000,
      collected: Math.floor(Math.random() * 45000) + 95000,
      transactions: Math.floor(Math.random() * 50) + 20,
    });
  }

  return days;
}

function generateCSV(data: any, reportType: string): string {
  const lines: string[] = [];
  
  lines.push(`Report Type,${reportType}`);
  lines.push(`Generated On,${new Date().toLocaleString()}`);
  lines.push('');

  if (data.summary) {
    lines.push('Summary');
    Object.entries(data.summary).forEach(([key, value]) => {
      lines.push(`${key},${value}`);
    });
    lines.push('');
  }

  if (data.daily) {
    lines.push('Daily Data');
    lines.push('Date,Expected,Collected,Transactions');
    data.daily.forEach((day: any) => {
      lines.push(`${day.date},${day.expected},${day.collected},${day.transactions}`);
    });
    lines.push('');
  }

  if (data.performance) {
    lines.push('Agent Performance');
    lines.push('Name,Collections,Customers,Efficiency');
    data.performance.forEach((agent: any) => {
      lines.push(`${agent.name},${agent.collections},${agent.customers},${agent.efficiency}`);
    });
  }

  return lines.join('\n');
}

export async function OPTIONS() {
  return corsOptions();
}

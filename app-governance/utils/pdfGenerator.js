import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export const generateAuditPDF = async (reports, zone = "All Zones") => {
    try {
        const totalReports = reports.length;
        const resolved = reports.filter(r => r.status === 'resolved' || r.status === 'closed').length;
        const completionRate = totalReports > 0 ? Math.round((resolved / totalReports) * 100) : 0;
        const reportDate = new Date().toLocaleDateString();

        const tableRows = reports.map((r, index) => {
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${r._id.slice(-6)}</td>
                    <td>${r.category}</td>
                    <td>${r.location?.zone || 'Unknown'}</td>
                    <td><span class="status ${r.status}">${r.status}</span></td>
                    <td>${r.materialsUsed || 'N/A'}</td>
                    <td>
                        <div class="img-container">
                            ${r.imageUrl ? `<img src="${r.imageUrl}" alt="Before" />` : '<span class="note">No Image</span>'}
                        </div>
                    </td>
                    <td>
                        <div class="img-container">
                            ${r.afterImage ? `<img src="${r.afterImage}" alt="After" />` : '<span class="note">No Image</span>'}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #1e293b; }
                        h1 { color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 5px; }
                        .subtitle { color: #64748b; font-size: 14px; margin-bottom: 30px; }
                        
                        .summary-box { 
                            display: flex; justify-content: space-between; 
                            background-color: #f8fafc; border: 1px solid #e2e8f0; 
                            padding: 20px; border-radius: 8px; margin-bottom: 30px;
                        }
                        .stat { text-align: center; }
                        .stat-value { font-size: 24px; font-weight: bold; color: #0f172a; }
                        .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; margin-top: 5px; }

                        table { width: 100%; border-collapse: collapse; font-size: 12px; }
                        th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
                        th { background-color: #f1f5f9; color: #475569; font-weight: bold; }
                        
                        .status { padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: capitalize; }
                        .status.closed, .status.resolved { background-color: #dcfce7; color: #166534; }
                        .status.pending, .status.urgent { background-color: #fee2e2; color: #991b1b; }
                        .status.assigned { background-color: #fef9c3; color: #854d0e; }

                        .img-container img { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; }
                        .note { color: #94a3b8; font-style: italic; font-size: 10px; }
                        
                        .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
                    </style>
                </head>
                <body>
                    <h1>CityGuard Audit Report</h1>
                    <div class="subtitle">Generated on ${reportDate} • ${zone}</div>

                    <div class="summary-box">
                        <div class="stat">
                            <div class="stat-value">${totalReports}</div>
                            <div class="stat-label">Total Logs</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${resolved}</div>
                            <div class="stat-label">Resolved / Closed</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${completionRate}%</div>
                            <div class="stat-label">Completion Rate</div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Ref ID</th>
                                <th>Category</th>
                                <th>Zone</th>
                                <th>Status</th>
                                <th>Materials Log</th>
                                <th>Proof (Before)</th>
                                <th>Proof (After)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows || '<tr><td colspan="8" style="text-align: center; color: #94a3b8;">No records found for this period.</td></tr>'}
                        </tbody>
                    </table>

                    <div class="footer">
                        Official Document Generated by CityGuard System • AMC Transparency Initative
                    </div>
                </body>
            </html>
        `;

        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        console.log('PDF generated at:', uri);

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                dialogTitle: 'Share CityGuard Audit PDF',
                UTI: 'com.adobe.pdf'
            });
        }

        return uri;
    } catch (error) {
        console.error("Error generating PDF:", error);
        throw error;
    }
};

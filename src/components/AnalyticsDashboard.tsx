import { BarChart3, DollarSign, Mail, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AnalyticsSummary } from '@/types/features';

interface AnalyticsDashboardProps {
  summary: AnalyticsSummary;
  onExport: () => void;
}

export const AnalyticsDashboard = ({ summary, onExport }: AnalyticsDashboardProps) => {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase">Total Clicks</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {summary.total_clicks}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-sky-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {summary.total_revenue.toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase">Email Leads</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {summary.total_leads}
              </p>
            </div>
            <Mail className="w-8 h-8 text-orange-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase">Avg. Revenue</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {summary.total_clicks > 0 ? (summary.total_revenue / summary.total_clicks).toFixed(2) : '0.00'}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Top Links */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Top Performing Links</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-700">
              <tr className="text-left text-xs text-slate-500 uppercase">
                <th className="pb-2">Link</th>
                <th className="pb-2">Clicks</th>
                <th className="pb-2">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {summary.top_links.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-slate-500">
                    No data yet
                  </td>
                </tr>
              ) : (
                summary.top_links.map(link => (
                  <tr key={link.link_id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {link.link_id}
                    </td>
                    <td className="py-3 font-semibold">{link.clicks}</td>
                    <td className="py-3 text-green-600 font-semibold">{link.revenue.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button
          onClick={onExport}
          variant="outline"
          className="flex items-center gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          Export Analytics
        </Button>
      </div>
    </div>
  );
};

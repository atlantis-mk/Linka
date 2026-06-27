import { ExternalLinkIcon, LayoutDashboardIcon, RefreshCwIcon } from 'lucide-react';
import { browser } from 'wxt/browser';
import { openUrl } from '@/src/lib/browserAdapter';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';

function App() {
  const workspaceUrl = browser.runtime.getURL('/newtab.html');
  const extensionName = browser.i18n.getMessage('extensionName') || 'MarkDock';

  return (
    <main className="min-w-80 bg-background p-3 text-foreground">
      <Card className="shadow-none" size="sm">
        <CardHeader>
          <CardTitle>{extensionName}</CardTitle>
          <CardDescription>浏览器工作区入口</CardDescription>
          <CardAction>
            <Badge variant="secondary">New Tab</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button
            className="justify-start"
            onClick={() => void openUrl(workspaceUrl)}
            type="button"
          >
            <LayoutDashboardIcon data-icon="inline-start" />
            打开工作区
          </Button>
          <Button
            className="justify-start"
            onClick={() => void openUrl(workspaceUrl)}
            type="button"
            variant="outline"
          >
            <RefreshCwIcon data-icon="inline-start" />
            同步浏览器数据
          </Button>
        </CardContent>
        <CardFooter className="justify-between gap-2">
          <span className="text-xs text-muted-foreground">书签和标签页统一查看</span>
          <Button
            onClick={() => void openUrl('chrome://newtab/')}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <ExternalLinkIcon />
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

export default App;

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  RotateCcw,
} from 'lucide-react-native';

import type { StatusIconToken } from '../lifecycle';
import type { LucideIcon } from 'lucide-react-native';

/** Resolves `StatusDisplay.icon` to a component. `lifecycle/display.ts` holds no React, by
 * design, so this is the one place a token becomes a glyph. */
export const STATUS_ICONS: Record<StatusIconToken, LucideIcon> = {
  alert: AlertCircle,
  clock: Clock,
  calendar: Calendar,
  check: CheckCircle2,
  rotate: RotateCcw,
};

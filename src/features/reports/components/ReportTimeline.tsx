import { Check } from 'lucide-react-native';
import { Image, StyleSheet, View } from 'react-native';

import { ContextChip, Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

import { TrackerApprovalControl } from './TrackerApprovalControl';

import type { TimelineNodeView } from '../trackerView';

export type ReportTimelineProps = {
  nodes: readonly TimelineNodeView[];
  onConfirm: () => void;
  onReject: () => void;
  isActing: boolean;
};

const MARKER_SIZE = 32;
const CHECK_SIZE = 18;
const DOT_SIZE = 10;
const CONNECTOR_WIDTH = 2;
const PHOTO_SIZE = 56;

function Marker({ state }: { state: TimelineNodeView['markerState'] }) {
  if (state === 'done') {
    return (
      <View style={[styles.marker, styles.markerDone]}>
        <Check size={CHECK_SIZE} color={colors.textInverse} />
      </View>
    );
  }
  if (state === 'current') {
    return (
      <View style={[styles.marker, styles.markerCurrent]}>
        <View style={styles.markerDot} />
      </View>
    );
  }
  return <View style={[styles.marker, styles.markerPending]} />;
}

/**
 * §8.2 F-06. Nodes run down the right edge, content to their left - purely presentational: every
 * label, marker state and chip arrives pre-resolved from `buildTrackerView`. No status string,
 * node number or CTA label lives here.
 */
export function ReportTimeline({
  nodes,
  onConfirm,
  onReject,
  isActing,
}: ReportTimelineProps) {
  return (
    <View accessibilityRole="progressbar">
      {nodes.map((node, index) => (
        <View key={node.node} style={styles.row}>
          <View style={styles.content}>
            <Text
              variant="body14Bold"
              color={node.markerState === 'pending' ? 'textSecondary' : 'textPrimary'}
              align="right"
            >
              {node.label}
            </Text>

            {node.dateTime ? (
              <Text variant="label12" color="textSecondary" align="right">
                {node.dateTime}
              </Text>
            ) : null}

            {node.subtext ? (
              <Text variant="label12" color="textSecondary" align="right">
                {node.subtext}
              </Text>
            ) : null}

            {node.chips.map((chip, chipIndex) => (
              // Chips carry no stable id of their own; the array is rebuilt whole each render.
              <ContextChip
                key={chipIndex}
                tint={chip.tint}
                icon={chip.icon}
                label={chip.label}
              />
            ))}

            {node.repairPhoto ? (
              <View style={styles.photoChip}>
                <Image source={{ uri: node.repairPhoto.url }} style={styles.photo} />
                <Text
                  variant="label12"
                  color="primaryPressed"
                  align="right"
                  style={styles.photoText}
                >
                  {node.repairPhoto.notes}
                </Text>
              </View>
            ) : null}

            {node.showApproval ? (
              <TrackerApprovalControl
                onConfirm={onConfirm}
                onReject={onReject}
                disabled={isActing}
              />
            ) : null}
          </View>

          <View style={styles.markerColumn}>
            <View
              style={[
                styles.connector,
                index === 0 ? styles.connectorHidden : styles.connectorPending,
                // The segment above is reached once this node is current or done.
                node.markerState !== 'pending' && styles.connectorDone,
              ]}
            />
            <Marker state={node.markerState} />
            <View
              style={[
                styles.connector,
                index === nodes.length - 1
                  ? styles.connectorHidden
                  : styles.connectorPending,
                // The segment below is reached only once this node itself is done.
                node.markerState === 'done' && styles.connectorDone,
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    gap: spacing[16],
  },
  markerColumn: {
    alignItems: 'center',
    width: MARKER_SIZE,
  },
  connector: {
    width: CONNECTOR_WIDTH,
    flex: 1,
    minHeight: spacing[16],
    backgroundColor: colors.border,
  },
  connectorPending: {
    backgroundColor: colors.border,
  },
  connectorDone: {
    backgroundColor: colors.primary,
  },
  connectorHidden: {
    backgroundColor: 'transparent',
  },
  marker: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDone: {
    backgroundColor: colors.primary,
  },
  markerCurrent: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  markerDot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  markerPending: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    gap: spacing[8],
    // Breathing room before the next node's row starts.
    paddingBottom: spacing[24],
  },
  photoChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[8],
    padding: spacing[8],
    borderRadius: radii[12],
    borderWidth: 1,
    backgroundColor: colors.primaryTint,
    borderColor: colors.primaryMuted,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: radii[6],
    backgroundColor: colors.surfaceMuted,
  },
  photoText: {
    flex: 1,
  },
});

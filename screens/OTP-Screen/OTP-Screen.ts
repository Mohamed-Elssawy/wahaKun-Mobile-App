import { StyleSheet } from 'react-native';
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F1EB',
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    paddingBottom: 56,
  },
  header: {
    flexDirection: 'column',
    width: '100%',
    height: 88,
  },
  headerNavigation: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    width: '100%',
    height: 84,
    paddingLeft: 24,
    paddingRight: 24,
    paddingTop: 48,
    paddingBottom: 12,
    textAlign: 'right',
  },
  StepOneWithLogoContainer: {
    width: 114,
    height: 24,
    alignItems: 'center',
    gap: 12,
    flexDirection: 'row-reverse',
  },
  palmTreeLogo: {
    width: 24,
    height: 24,
  },
  stepOneText: {
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    textAlign: 'right',
    color: '#363939',
  },
  goBack: {
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
    textAlign: 'right',
    color: '#B1B2B2',
    width: 37,
    height: 21,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#EAEAEA', // this was your `divider` style — the gray track
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    width: 9.75,
    height: 4,
    backgroundColor: '#1F2223', // Neutral/N900, from your panel
    right: 0, // pinned to the right edge
  },
});

export default styles;

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
  headerAndInputText: {
    flexDirection: 'column',
    width: '100%',
    gap: 40,
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
  stepOneText: {
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    textAlign: 'right',
    color: '#363939',
  },
  palmTreeLogo: {
    width: 24,
    height: 24,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#EAEAEA',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    width: '100%', // step 7 of 10 — adjust to your real progress logic
    height: 4,
    backgroundColor: '#1F2223',
    right: 0,
  },

  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  textContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  successTitle: {
    width: '100%',
    fontFamily: 'Cairo-Regular',
    fontWeight: '600',
    fontSize: 28,
    lineHeight: 40,
    textAlign: 'center',
    color: '#1F2223',
  },
  successSubtitle: {
    width: '100%',
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color: '#57595A',
  },

  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 48,
    paddingLeft: 24,
    paddingRight: 24,
  },
  startButton: {
    flexDirection: 'row',
    width: '100%',
    height: 48,
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#1A6B3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textOfStart: {
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#FFFFFF',
  },
});

export default styles;

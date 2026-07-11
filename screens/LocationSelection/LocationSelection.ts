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
  bodyheader: {
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
    width: 97.5,
    height: 4,
    backgroundColor: '#1F2223', // Neutral/N900, from your panel
    right: 0, // pinned to the right edge
  },
  bodyContainer: {
    flexDirection: 'column',
    width: '100%',
    gap: 40,
  },
  questionContainer: {
    flexDirection: 'column',
    width: '100%',
    height: 30,
    paddingRight: 24,
    paddingLeft: 24,
    gap: 12,
  },
  question: {
    fontFamily: 'Cairo-Regular',
    fontWeight: '600',
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'column',
    width: '100%',
    paddingLeft: 24,
    paddingRight: 24,
    gap: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 48,
    justifyContent: 'space-between',
    paddingLeft: 24,
    paddingRight: 24,
  },
  nextButton: {
    flexDirection: 'row-reverse',
    width: 93,
    height: 48,
    borderRadius: 6,
    padding: 12,
    gap: 10,
    backgroundColor: '#1A6B3C',
  },
  textOfNext: {
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  errorText: {
    color: '#57595A',
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
  },
  disabledButton: {
    backgroundColor: '#B1B2B2',
  },
});

export default styles;

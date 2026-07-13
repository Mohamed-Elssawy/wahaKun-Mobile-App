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
    height: 271,
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
    width: 146.25,
    height: 4,
    backgroundColor: '#1F2223', // Neutral/N900, from your panel
    right: 0, // pinned to the right edge
  },

  formContainer: {
    flexDirection: 'column',
    width: '100%',
    height: 143,
    gap: 40,
  },
  namingQuestion: {
    width: 390,
    height: 30,
    fontFamily: 'Cairo-Regular',
    fontWeight: '600',
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
  },
  cardsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 216,
    gap: 16,
  },
  card: {
    borderWidth: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: 342,
    height: 100,
    gap: 24,
    borderColor: '#B1B2B2',
  },
  // Applied on top of `card` when this card is the chosen role — light green
  // fill + green border, matching the Figma state. Icon color intentionally
  // doesn't change here (it's already green in both states in the design).
  cardSelected: {
    backgroundColor: '#EAF6EF',
    borderColor: '#1A6B3C',

  },
  cardTitleSelected:{
    color: '#0A4B25'
  },
  cardSubtitleSelected:{
    color: '#0A4B25'
  },
  cardTextWrap: { flex: 1 },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'right',
    fontFamily: 'Cairo-Regular',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#797A7B',
    textAlign: 'right',
    fontFamily: 'NotoSansArabic_Condensed-Regular',
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
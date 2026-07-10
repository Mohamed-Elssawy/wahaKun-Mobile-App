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
  topOfPage: {
    flexDirection: 'column',
    width: '100%',
    height: 340,
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
    width: 48.75,
    height: 4,
    backgroundColor: '#1F2223', // Neutral/N900, from your panel
    right: 0, // pinned to the right edge
  },
  imageUploadContainer: {
    flexDirection: 'column',
    width: '100%',
    height: 212,
    gap: 40,
  },
  textContainer: {
    flexDirection: 'column',
    width: '100%',
    height: 92,
    gap: 12,
    paddingLeft: 24,
    paddingRight: 24,
    textAlign: 'center',
  },
  addProfilePicTitle: {
    width: 342,
    height: 30,
    fontFamily: 'Cairo-Regular',
    fontWeight: '600',
    fontSize: 24,
    lineHeight: 30,
    color: '#363939',
    textAlign: 'center',
  },
  addProfilePicSubTitle: {
    width: '100%',
    height: 50,
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    fontSize: 14,
    lineHeight: 21,
    color: '#797A7B',
    textAlign: 'center', // add this
  },
  imageContainer: {
    flexDirection: 'column',
    width: '100%',
    height: 80,
    gap: 10,
    paddingLeft: 24,
    paddingRight: 24,
    alignItems: 'center',
  },
  imageShape: {
    flexDirection: 'column',
    width: 80,
    height: 80,
    borderRadius: 100,
    backgroundColor: '#B1B2B2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: 48,
    paddingHorizontal: 24,
  },
  nextButton: {
    flexDirection: 'row-reverse',
    width: 150,
    height: 48,
    padding: 6,
    gap: 8,
    backgroundColor: '#1A6B3C',
    borderRadius: 6,
    alignItems: 'center',
  },
  textOfNext: {
    width: 94,
    height: 24,
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textOfSkip: {
    fontSize: 12,
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    fontWeight: '400',
    lineHeight: 18,
    color: '#B1B2B2',
  },

  // pop up style for the image selector
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  modalContainer: {
    backgroundColor: '#F4F1EB',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 30,
  },

  modalHandle: {
    width: 45,
    height: 5,
    borderRadius: 20,
    backgroundColor: '#B1B2B2',
    alignSelf: 'center',
    marginBottom: 25,
  },

  modalButton: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },

  modalButtonText: {
    fontSize: 18,
    fontFamily: 'Cairo-Regular',
    color: '#1A6B3C',
  },

  cancelButton: {
    marginTop: 18,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },

  cancelButtonText: {
    fontSize: 18,
    fontFamily: 'Cairo-Regular',
    color: '#D32F2F',
  },
});

export default styles;

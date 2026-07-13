import { StyleSheet } from 'react-native';
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F1EB',
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    paddingBottom: 32,
  },
  headerAndInputText: {
    flexDirection: 'column',
    width: '100%',
    gap: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },

  formContainer: {
    flexDirection: 'column',
    width: '100%',
    gap: 32,
    paddingHorizontal: 24,
  },
  textContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  namingQuestion: {
    width: '100%',
    fontFamily: 'Cairo-Regular',
    fontWeight: '600',
    fontSize: 24,
    lineHeight: 40,
    textAlign: 'center',
    color: '#1F2223',
  },
  namingSubQuestion: {
    width: '100%',
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color: '#57595A',
  },

  inputfeildContainer: {
    flexDirection: 'column',
    width: '100%',
    gap: 20,
  },
  fieldGroup: {
    flexDirection: 'column',
    width: '100%',
    alignItems: 'flex-end',
    gap: 12,
  },
  fieldLabel: {
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'right',
    color: '#1F2223',
  },

  otpRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  otpBox: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2223',
    lineHeight: 20,
  },
  otpBoxFilled: {
    borderColor: '#1A6B3C',
    backgroundColor: '#E8F3EC',
    color: '#1A6B3C',
  },

  resendText: {
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color: '#1A6B3C',
    width: '100%',
  },

  bottomContainer: {
    flexDirection: 'column',
    width: '100%',
    gap: 16,
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
    width: '100%',
    height: 48,
    borderRadius: 6,
    padding: 12,
    gap: 10,
    backgroundColor: '#1A6B3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textOfNext: {
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  errorText: {
    color: '#D14343',
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'right',
    paddingHorizontal: 24,
  },
  disabledButton: {
    backgroundColor: '#B1B2B2',
  },

  noCodeText: {
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color: '#57595A',
    width: '100%',
  },
  noCodeLink: {
    fontWeight: '700',
    color: '#1A6B3C',
  },
});

export default styles;
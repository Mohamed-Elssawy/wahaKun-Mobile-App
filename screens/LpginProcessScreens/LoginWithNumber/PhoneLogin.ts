import { StyleSheet } from 'react-native';
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F1EB',
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },

  content: {
    flexDirection: 'column',
    width: '100%',
    paddingHorizontal: 24,
    gap: 24,
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
    gap: 8,
  },
  fieldGroup: {
    flexDirection: 'column',
    width: '100%',
    gap: 8,
  },
  fieldLabel: {
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'right',
    color: '#1F2223',
  },

  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    gap:14,
  },
  countrySelector: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  dialCodeText: {
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2223',
  },
  flagText: {
    fontSize: 18,
  },
  phoneDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#EAEAEA',
  },
  phoneNumberInput: {
    flex: 1,
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    fontSize: 15,
    color: '#1F2223',
    lineHeight: 15,
    textAlign: 'center'
  },

  sendCodeButton: {
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
  sendCodeText: {
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  disabledButton: {
    backgroundColor: '#B1B2B2',
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#8E9090',
  },
  dividerText: {
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    fontWeight: '400',
    fontSize: 20,
    color: '#8E9090',
  },

  emailLoginButton: {
    flexDirection: 'row',
    width: '100%',
    height: 48,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#57595A',
    padding: 12,
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailLoginText: {
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#57595A',
  },

  cantAccessText: {
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color: '#57595A',
    width: '100%',
  },
  cantAccessLink: {
    fontWeight: '700',
    color: '#1A6B3C',
  },

  footer: {
    marginTop: 'auto',
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  footerText: {
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: '#B1B2B2',
  },
  footerLink: {
    fontWeight: '700',
    color: '#1A6B3C',
    textDecorationLine: 'underline',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '60%',
  },
  modalTitle: {
    fontFamily: 'Cairo-Regular',
    fontWeight: '600',
    fontSize: 18,
    textAlign: 'center',
    color: '#1F2223',
    marginBottom: 12,
  },
  countryListItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F1EB',
  },
  countryListItemSelected: {
    backgroundColor: '#F4F1EB',
  },
  countryListNameRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  countryListName: {
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    fontSize: 15,
    color: '#1F2223',
  },
  countryListDial: {
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    fontSize: 14,
    color: '#57595A',
  },
});

export default styles;
/**
 * components/PayPalButton.jsx
 * Redirige vers components/SasPayButton.jsx (remplacement complet de PayPal par SasPay)
 */
import React from 'react';
import SasPayButton from './SasPayButton';

export default function PayPalButton(props) {
  return <SasPayButton {...props} />;
}

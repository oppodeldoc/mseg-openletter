import React from 'react';

const icons = {
  signed: '/images/signed-icon.png',
  email: '/images/email-icon.png',
  error: '/images/info-icon.png',
};

const Notification = ({ icon, title, message }) => (
  <div className="my-4 py-6 px-4 rounded border border-brand-green/30 bg-brand-green-tint text-center" role="status">
    {icon && icons[icon] && <img src={icons[icon]} alt="" className="h-12 w-12 mx-auto my-0" />}
    <h2 className="text-2xl font-bold text-brand-green mt-3 mb-2">{title}</h2>
    {message && <div className="text-brand-ink">{message}</div>}
  </div>
);

export default Notification;

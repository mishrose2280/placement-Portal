import React from 'react';
import AdobeLogo from '../images/Adobe-logo.jpeg';
import CiscoLogo from '../images/Cisco-logo.jpg';
import OracleLogo from '../images/Oracle-Logo.jpg';
// List of image paths
const imagePaths = [
  OracleLogo,
  CiscoLogo,
  AdobeLogo
  // Add more image paths as needed .
];

export default function HomeContent() {
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1 style={{ fontSize: '36px', marginBottom: '10px' }}>Welcome to Our Placement Platform</h1>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '20px' }}>Connecting talent with opportunity</p>
      <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>Our Recruiters</h2>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        {imagePaths.map((image, index) => (
        <img key={index} src={image}
        style={{ width: '150px', height: '150px', margin: '0 10px', borderRadius: '50%', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)' }}
        alt={`Company ${index + 1}`} />
      ))}
      </div>
      <p style={{ fontSize: '16px', marginBottom: '20px' }}>Join us to explore opportunities with leading companies</p>
    </div>
  );
}

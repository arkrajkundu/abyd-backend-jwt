import React from 'react';
import './Report.css';

const Report = ({ reportData }) => {
  return (
    <div className="report-container">
      <h2>REPORT</h2>

      {reportData.license !== '' && (
        <div className="report-section">
          <h3>RBI License</h3>
          <p>
            {reportData.license === 'YES'
              ? 'You have obtained the RBI license.'
              : 'You need to apply for an RBI license to avoid penalties.'}
          </p>
        </div>
      )}

      {reportData.businessActivities.length > 0 && (
        <div className="report-section">
          <h3>Business Activities</h3>
          <ul>
            {reportData.businessActivities.map((activity, index) => (
              <li key={index}>{activity}</li>
            ))}
          </ul>
        </div>
      )}

      {reportData.cddFramework !== '' && (
        <div className="report-section">
          <h3>Customer Due Diligence Framework</h3>
          <p>
            {reportData.cddFramework === 'YES'
              ? 'You have established a proper CDD framework as per RBI guidelines.'
              : 'It is mandatory to establish a CDD framework to avoid penalties.'}
          </p>
        </div>
      )}

      {reportData.bit_string && (
        <div className="report-section">
          <h3>Bit String</h3>
          <p>{reportData.bit_string}</p>
        </div>
      )}

      <div className="report-section">
        <h3>Penalties for Non-Compliance</h3>
        <p>
          Non-compliance with RBI regulations can result in penalties up to ₹250 crores.
        </p>
      </div>

      <div className="report-section">
        <h3>Key Recommendations</h3>
        <ul>
          <li>Apply for RBI license if not already done.</li>
          <li>Implement robust KYC and CDD practices.</li>
          <li>Ensure compliance with the Prevention of Money Laundering Act (PMLA).</li>
        </ul>
      </div>
    </div>
  );
};

export default Report;

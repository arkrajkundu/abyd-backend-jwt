import React, { useState } from 'react';
import Questionnaire from '../components/Questionnaire';
import Report from '../components/Report';
import './ReportPage.css';

const ReportPage = () => {
  const [reportData, setReportData] = useState({
    license: '',
    businessActivities: [],
    cddFramework: '',
  });

  const handleUpdate = (data) => {
    setReportData(data);
  };

  return (
    <div className="report-page-container">
      <div className="questionnaire-section">
        <Questionnaire onUpdate={handleUpdate} />
      </div>
      <div className="report-section">
        <Report reportData={reportData} />
      </div>
    </div>
  );
};

export default ReportPage;

import React, { useState } from 'react';
import './Questionnaire.css';

const Questionnaire = ({ onUpdate }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    license: 'NO',
    businessActivities: [],
    cddFramework: 'NO',
  });

  const [bitString, setBitString] = useState('');
  const [questionDesc, setQuestionDesc] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [showTip, setShowTip] = useState(false);
  const [tip, setTip] = useState('');

  const userId = "user1";
  const emailId = "user1@gmail.com";
  const company = "companyName";
  const industry = "Fintech";
  const subIndustry = "FintechSub";

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (type === "checkbox") {
      const updatedActivities = checked
        ? [...answers.businessActivities, value]
        : answers.businessActivities.filter(activity => activity !== value);
      setAnswers({ ...answers, businessActivities: updatedActivities });
      onUpdate({ ...answers, businessActivities: updatedActivities });
    } else {
      setAnswers({ ...answers, [name]: value });
      onUpdate({ ...answers, [name]: value });
    }
  };

  const handleNext = async () => {
    if (currentStep < 2) {
      const requestBody = {
        user_id: userId,
        email_id: emailId,
        company: company,
        industry: industry,
        sub_industry: subIndustry,
        question_no: currentStep + 1,
        keywords: answers.license === 'YES' ? ['yes'] : ['no'],
        bit_string: '1'
      };

      try {
        const response = await fetch('http://20.244.86.79:8000/get-questions/', {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (response.ok) {
          setBitString(data.output.bit_string);
          setCurrentStep(data.output.question_no - 1);
          setQuestionDesc(data.output.question_desc);
          setKeywords(data.output.keywords);
          if (data.output.tip) {
            setTip(data.output.tip);
          } else {
            setTip('');
          }

          onUpdate({
            ...answers,
            bit_string: data.output.bit_string,
          });
        } else {
          console.error('Error fetching next question:', data.message);
        }
      } catch (error) {
        console.error('API call failed:', error);
      }
    }
  };

  const toggleTipPopup = () => {
    setShowTip(!showTip);
  };

  const renderQuestion = () => {
    return (
      <div className="question">
        <label>{questionDesc}</label>
        <div>
          {keywords.map((keyword, index) => (
            <label key={index}>
              <input
                type="checkbox"
                name="businessActivities"
                value={keyword}
                onChange={handleChange}
              />
              {keyword}
            </label>
          ))}
        </div>
      </div>
    );
  };

  console.log(questionDesc)

  return (
    <div className="questionnaire-container">
      <h2>{currentStep + 1}/3 About The Company</h2>
      {renderQuestion() || "Placeholder for Question"}
      {tip && (
        <span className="tip-icon" onClick={toggleTipPopup}>
          ❓
        </span>
      )}
      {showTip && (
        <div className="tip-popup">
          <p>{tip}</p>
          <button onClick={toggleTipPopup}>Close</button>
        </div>
      )}
      {currentStep < 2 && (
        <button className="save-button" onClick={handleNext}>Save and Next</button>
      )}
    </div>
  );
};

export default Questionnaire;

import React, { useState } from 'react';
import Logo from "../components/assets/logo.png";

const Header = ({ onGenerateCode, onPreview, projectName}) => {
  const [prompt, setPrompt] = useState('');

  const handleInputChange = (e) => {
    setPrompt(e.target.value);
  };

  const handleSubmit = () => {
    onGenerateCode(prompt);
  };

  const handleDownloadZip = (projectName) => {
    if (projectName) {
      console.log(projectName)
    } else {
      console.error("Project name is undefined");
    }
    window.location.href = `http://localhost:5000/download-project/${projectName}`
  };

  // const handleDownloadPdf = () => {
  //   window.location.href = `http://localhost:5000/download-pdf/${projectName}`
  // };

  return (
    <header>
      <div className="logo">
        <img src={Logo} alt="Logo" />
      </div>
      <div className="inputContainer">
        <input
          type="text"
          id="cccccc"
          placeholder='Build a pawsome website'
          value={prompt}
          onChange={handleInputChange}
        />
        <button onClick={handleSubmit}>Purr-duce</button>
      </div>
      <div className="controllers">
        <button onClick={onPreview}>Preview</button>
        <button onClick = {() => handleDownloadZip(projectName)}>Download</button>
        {/* <button onClick={() => handleDownloadPdf(projectName)}>Download PDF</button> */}
      </div>
    </header>
  );
};

export default Header;
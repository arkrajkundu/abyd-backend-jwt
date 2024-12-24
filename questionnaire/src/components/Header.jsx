import React from 'react'
import assets from '../assets/assets.js'
import './Header.css'

const Header = () => {
  return (
    <div className='header'>
      <div className='logo'>
        <img src={assets.abyd} alt="abyd logo" />
      </div>
      <div className='buttons'>
        <button>Contact</button>
        <button>About</button>
        <button>Terms</button>
      </div>
      <div className='cta-button'>
        <button>Give it a try!</button>
      </div>
    </div>
  )
}

export default Header

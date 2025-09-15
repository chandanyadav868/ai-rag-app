import React from 'react'

function About() {
  return (
    <section className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-4 text-center">About AI Image Editor</h1>
      <p className="text-lg text-gray-700 mb-6 text-center">
        AI Image Editor is a powerful web application that leverages artificial intelligence to help you edit and enhance your images effortlessly. Whether you want to remove backgrounds, apply artistic filters, or adjust image properties, our intuitive tools make it easy for everyone.
      </p>
      <ul className="list-disc list-inside text-gray-800 mb-6">
        <li>Apply AI-powered filters and effects</li>
        <li>Adjust brightness, contrast, and more</li>
        <li>Fast, secure, and privacy-focused</li>
      </ul>
      <p className="text-gray-600 text-center">
        Start editing your images today and experience the future of photo editing!
      </p>
    </section>
  )
}

export default About
import React from 'react';
import Layout from '../components/Layout';

const TenantRights = () => {
  const rights = [
    {
      title: 'Right to Habitable Housing',
      description: 'You have the right to live in a safe, clean, and habitable property.',
      details: [
        'Landlord must maintain the property in good condition',
        'Basic utilities (water, electricity, heating) must be functional',
        'Property must meet local health and safety standards',
        'Landlord must make necessary repairs within reasonable time'
      ]
    },
    {
      title: 'Right to Privacy',
      description: 'Landlords must respect your privacy and provide proper notice before entering.',
      details: [
        'Landlord must give 24-48 hours notice before entering (check local laws)',
        'Entry is only allowed for specific reasons (repairs, inspections, emergencies)',
        'You can refuse entry if proper notice wasn\'t given',
        'Emergency situations are an exception to notice requirements'
      ]
    },
    {
      title: 'Right to Fair Treatment',
      description: 'You cannot be discriminated against based on protected characteristics.',
      details: [
        'No discrimination based on race, religion, gender, or family status',
        'Landlord cannot refuse reasonable accommodations for disabilities',
        'Equal treatment in rental applications and lease terms',
        'Protection against retaliation for asserting your rights'
      ]
    },
    {
      title: 'Right to Proper Notice',
      description: 'You must receive proper notice for rent increases, lease changes, or eviction.',
      details: [
        'Rent increases require advance notice (typically 30 days)',
        'Lease changes must be agreed upon by both parties',
        'Eviction requires proper legal process and notice',
        'Notice must be in writing and delivered properly'
      ]
    },
    {
      title: 'Right to Security Deposit Return',
      description: 'Your security deposit must be returned according to local laws.',
      details: [
        'Deposit must be returned within specified timeframe (usually 30 days)',
        'Landlord must provide itemized list of any deductions',
        'Only actual damages beyond normal wear and tear can be deducted',
        'You have the right to dispute unfair deductions'
      ]
    }
  ];

  const resources = [
    {
      title: 'Local Tenant Rights Organization',
      description: 'Get help with landlord-tenant disputes and legal advice',
      contact: '1-800-TENANT-HELP'
    },
    {
      title: 'Housing Authority',
      description: 'Report housing violations and get assistance with housing issues',
      contact: '1-800-HOUSING-HELP'
    },
    {
      title: 'Legal Aid Services',
      description: 'Free or low-cost legal assistance for housing matters',
      contact: '1-800-LEGAL-AID'
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Know Your Rights as a Tenant
          </h1>
          <p className="text-gray-600">
            Understanding your rights helps you maintain a healthy landlord-tenant relationship
            and protects you from unfair treatment.
          </p>
        </div>

        {/* Rights Cards */}
        <div className="grid gap-6">
          {rights.map((right, index) => (
            <div key={index} className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {right.title}
              </h2>
              <p className="text-gray-600 mb-4">{right.description}</p>
              <div className="space-y-2">
                {right.details.map((detail, detailIndex) => (
                  <div key={detailIndex} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Important Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-amber-500 rounded-full flex-shrink-0 flex items-center justify-center">
              <span className="text-white text-sm font-bold">!</span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-amber-900 mb-2">
                Important Notice
              </h3>
              <p className="text-amber-800">
                Tenant rights vary by location. The information provided here is general guidance.
                Always check your local and state laws for specific rights and protections in your area.
                When in doubt, consult with a qualified legal professional or tenant rights organization.
              </p>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Need Help? Contact These Resources
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">{resource.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                <p className="text-sm font-medium text-blue-600">{resource.contact}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Documentation Tips */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Documentation Tips
          </h2>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex-shrink-0 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <p className="text-gray-700">
                Keep records of all communications with your landlord (emails, texts, letters)
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex-shrink-0 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <p className="text-gray-700">
                Take photos of any property damage or issues before and after repairs
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex-shrink-0 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <p className="text-gray-700">
                Keep copies of your lease agreement, rent receipts, and any notices
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex-shrink-0 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <p className="text-gray-700">
                Document any violations of your rights with dates and details
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TenantRights;

/**
 * Consolidate all onboarding data into final profile
 */
export const consolidateProfile = () => {
  try {
    const step1 = JSON.parse(localStorage.getItem('onboarding_step1') || '{}');
    const step3 = JSON.parse(localStorage.getItem('onboarding_step3') || '{}');
    const step4Form = JSON.parse(localStorage.getItem('onboarding_step4_form') || '{}');
    const step4Employment = JSON.parse(localStorage.getItem('onboarding_step4_employment') || '[]');
    const step4References = JSON.parse(localStorage.getItem('onboarding_step4_references') || '[]');
    const step4Licenses = JSON.parse(localStorage.getItem('onboarding_step4_licenses') || '[]');
    const step4Certifications = JSON.parse(localStorage.getItem('onboarding_step4_certifications') || '[]');
    const step5 = JSON.parse(localStorage.getItem('step5Data') || '{}');
    const resumeData = JSON.parse(localStorage.getItem('resumeData') || '{}');

    const consolidatedProfile = {
      // Account/Login Information
      account: {
        firstName: step1.firstName || '',
        lastName: step1.lastName || '',
        email: step1.email || '',
        phone: step1.phone || '',
        referralSource: step1.referralSource || '',
        createdAt: new Date().toISOString()
      },
      
      // Personal Information
      personalInfo: {
        fullLegalName: step3.fullLegalName || '',
        preferredFirstName: step3.preferredFirstName || '',
        maidenName: step3.maidenName || '',
        previousNames: step3.previousNames || '',
        email: step3.email || step1.email || '',
        phone: step3.phone || step1.phone || '',
        linkedinUrl: step3.linkedinUrl || '',
        website: step3.website || '',
        streetAddress: step3.streetAddress || '',
        city: step3.city || '',
        state: step3.state || '',
        postalCode: step3.postalCode || '',
        county: step3.county || '',
        country: step3.country || 'US',
        emergencyContact: {
          name: step3.emergencyName || '',
          relationship: step3.emergencyRelationship || '',
          phone: step3.emergencyPhone || '',
          alternatePhone: step3.emergencyPhoneAlt || ''
        },
        sensitiveInfo: {
          dlNumber: step3.dlNumber || '',
          dlState: step3.dlState || '',
          dateOfBirth: step3.dateOfBirth || '',
          ssnLast4: step3.ssnLast4 || ''
        },
        residentialHistory: step3.residentialHistory || []
      },
      
      // Professional Information
      professionalInfo: {
        jobSearchPreferences: {
          desiredSalary: step4Form.desiredSalary || '',
          availableStartDate: step4Form.availableStartDate || '',
          workArrangement: step4Form.workArrangement || [],
          willingToRelocate: step4Form.willingToRelocate || '',
          travelPercentage: step4Form.travelPercentage || ''
        },
        legalCompliance: {
          legallyAuthorized: step4Form.legallyAuthorized || '',
          requiresSponsorship: step4Form.requiresSponsorship || '',
          nonCompeteAgreement: step4Form.nonCompeteAgreement || '',
          criminalHistory: step4Form.criminalHistory || '',
          criminalHistoryDetails: step4Form.criminalHistoryDetails || '',
          backgroundCheckConsent: step4Form.backgroundCheckConsent || '',
          workRestrictions: step4Form.workRestrictions || '',
          legalExplanation: step4Form.legalExplanation || ''
        },
        securityClearance: {
          hasClearance: step4Form.hasSecurityClearance || 'no',
          level: step4Form.clearanceLevel || '',
          grantDate: step4Form.clearanceGrantDate || '',
          expirationDate: step4Form.clearanceExpDate || ''
        },
        employment: step4Employment,
        licenses: step4Licenses,
        certifications: step4Certifications,
        references: step4References,
        education: JSON.parse(localStorage.getItem('onboarding_step4_education') || '[]')
      },
      
      // Disclosures & Authorizations
      disclosures: {
        gender: step5.gender || '',
        hispanicLatino: step5.hispanicLatino || '',
        disability: step5.disability || '',
        race: step5.race || [],
        veteran: step5.veteran || [],
        profileApproved: step5.profileApproved || false,
        signature: step5.signature || '',
        signatureDate: step5.signatureDate || '',
        finalAuthorization: step5.finalAuthorization || false
      },
      
      // Parsed Resume Data (for reference)
      resumeData: {
        profileDraft: resumeData.profileDraft || {},
        summary: resumeData.summary || {},
        confidence: resumeData.confidence || 0
      },
      
      // Metadata
      metadata: {
        createdAt: new Date().toISOString(),
        status: 'pending_payment',
        source: 'web_onboarding',
        version: '1.0'
      }
    };

    // Save consolidated profile
    localStorage.setItem('consolidatedProfile', JSON.stringify(consolidatedProfile));
    
    console.log('✅ Profile consolidated successfully');
    return consolidatedProfile;
    
  } catch (error) {
    console.error('❌ Failed to consolidate profile:', error);
    throw error;
  }
};

/**
 * Clear all temporary onboarding data after successful payment
 */
export const clearOnboardingData = () => {
  const keysToKeep = ['consolidatedProfile', 'userProfile', 'authToken'];
  
  const keysToRemove = [];
  Object.keys(localStorage).forEach(key => {
    if ((key.startsWith('onboarding_') || key.startsWith('step') || key === 'resumeData') && !keysToKeep.includes(key)) {
      keysToRemove.push(key);
    }
  });
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  console.log(`✅ Cleared ${keysToRemove.length} temporary onboarding items`);
};

/**
 * Get current onboarding progress
 */
export const getOnboardingProgress = () => {
  const steps = {
    step1: !!localStorage.getItem('onboarding_step1'),
    step3: !!localStorage.getItem('onboarding_step3'),
    step4: !!localStorage.getItem('onboarding_step4_form'),
    step5: !!localStorage.getItem('step5Data')
  };
  
  const completed = Object.values(steps).filter(Boolean).length;
  const total = Object.keys(steps).length;
  
  return {
    steps,
    completed,
    total,
    percentage: Math.round((completed / total) * 100)
  };
};


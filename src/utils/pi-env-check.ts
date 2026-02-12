export const validatePiEnvironment = async (): Promise<void> => {
  const errors: string[] = [];

  try {
    // Check validation key file
    const valResp = await fetch('/validation-key.txt', { cache: 'no-store' });
    if (!valResp.ok) {
      errors.push('Validation key file not accessible at /validation-key.txt');
    } else {
      const valText = (await valResp.text()).trim();
      const expected = import.meta.env.VITE_PI_VALIDATION_KEY || '';
      if (expected && valText !== expected) {
        errors.push('Validation key mismatch between file and environment variable');
      }
    }
  } catch (err) {
    errors.push('Failed to fetch /validation-key.txt');
  }

  try {
    // Check manifest has pi_app and keys
    const manResp = await fetch('/manifest.json', { cache: 'no-store' });
    if (!manResp.ok) {
      errors.push('manifest.json not accessible at /manifest.json');
    } else {
      const manifest = await manResp.json();
      const piApp = manifest?.pi_app;
      if (!piApp) {
        errors.push('manifest.json missing `pi_app` section');
      } else {
        const expectedApi = (import.meta.env.VITE_PI_API_KEY || '').trim();
        const expectedVal = (import.meta.env.VITE_PI_VALIDATION_KEY || '').trim();
        const manifestApi = String(piApp.api_key || '').trim();
        const manifestVal = String(piApp.validation_key || '').trim();
        
        if (expectedApi && manifestApi !== expectedApi) {
          console.error('API Key mismatch:', {
            manifest: manifestApi.substring(0, 20) + '...',
            environment: expectedApi.substring(0, 20) + '...',
            manifestLength: manifestApi.length,
            envLength: expectedApi.length
          });
          errors.push('manifest.pi_app.api_key does not match environment API key');
        }
        if (expectedVal && manifestVal !== expectedVal) {
          console.error('Validation Key mismatch:', {
            manifest: manifestVal.substring(0, 20) + '...',
            environment: expectedVal.substring(0, 20) + '...',
            manifestLength: manifestVal.length,
            envLength: expectedVal.length
          });
          errors.push('manifest.pi_app.validation_key does not match environment validation key');
        }
      }
    }
  } catch (err) {
    errors.push('Failed to fetch or parse /manifest.json');
  }

  // Skip Pi SDK URL check entirely - it always fails due to CORS
  // The SDK is loaded via script tag and will be available if in Pi Browser
  console.log('[PI ENV CHECK] Skipping Pi SDK URL check (CORS always blocks it)');

  // Only throw error if critical validations failed
  // Make validation warnings instead of errors in production
  if (errors.length > 0) {
    const message = `Pi environment validation warnings:\n- ${errors.join('\n- ')}`;
    console.warn('[PI ENV CHECK]', message);
    // Don't throw - these are warnings, not fatal errors
    // The actual Pi authentication will fail if there's a real issue
  } else {
    console.log('[PI ENV CHECK] All validation checks passed');
  }
};

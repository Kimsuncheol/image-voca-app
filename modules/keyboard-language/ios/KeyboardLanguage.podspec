Pod::Spec.new do |s|
  s.name           = 'KeyboardLanguage'
  s.version        = '1.0.0'
  s.summary        = 'Keyboard language inspection for quiz input'
  s.description    = 'Provides best-effort native keyboard language inspection for quiz input fields.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '15.1',
    :tvos => '15.1'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end

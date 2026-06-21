Pod::Spec.new do |s|
  s.name           = 'LockScreenVocabulary'
  s.version        = '1.0.0'
  s.summary        = 'Lock screen vocabulary widget bridge'
  s.description    = 'Writes lock screen vocabulary payloads to an iOS App Group for WidgetKit.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '15.1'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end

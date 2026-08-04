import re

with open('mobile/src/screens/client/ClientHome.js', 'r') as f:
    code = f.read()

# Add currentUser state
code = code.replace("const [artisans, setArtisans] = useState([]);", "const [artisans, setArtisans] = useState([]);\n  const [currentUser, setCurrentUser] = useState(null);")

# Add fetchCurrentUser function
fetch_user_fn = """
  const fetchCurrentUser = async () => {
    try {
      const importApi = require('../../api').default;
      const res = await importApi.get('/users/me');
      setCurrentUser(res.data);
      // update async storage just in case
      await AsyncStorage.setItem('userData', JSON.stringify(res.data));
    } catch (err) {
      console.error('Failed to fetch user', err);
    }
  };
"""

code = code.replace("const fetchProviders = async (region = null, lat = null, lng = null) => {", fetch_user_fn + "\n  const fetchProviders = async (region = null, lat = null, lng = null) => {")

# Call fetchCurrentUser in useFocusEffect
code = code.replace("fetchProviders(locationName !== 'Permission Denied' && locationName !== 'GPS Error' ? locationName : null);", "fetchCurrentUser();\n        fetchProviders(locationName !== 'Permission Denied' && locationName !== 'GPS Error' ? locationName : null);")

# Add banner
banner_jsx = """
      {currentUser?.verification?.verificationStatus === 'pending' && (
        <View style={{ backgroundColor: '#FEF3C7', padding: 12, marginHorizontal: 24, marginBottom: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FCD34D' }}>
          <Text style={{ color: '#92400E', fontSize: 13, fontWeight: '600' }}>Your account is pending verification from the admin. Booking is disabled.</Text>
        </View>
      )}
"""

code = code.replace("<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>", "<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>\n" + banner_jsx)

# Block booking
old_onpress = "onPress={() => navigation.navigate('ArtisanDetails', { artisan: provider, isRequested: requestedProviderIds.includes(provider.id) })}"
new_onpress = """onPress={() => {
                  if (currentUser?.verification?.verificationStatus === 'pending') {
                    Alert.alert('Account Pending', 'Your account is pending verification. You cannot make bookings yet.');
                  } else {
                    navigation.navigate('ArtisanDetails', { artisan: provider, isRequested: requestedProviderIds.includes(provider.id) });
                  }
                }}"""
code = code.replace(old_onpress, new_onpress)

with open('mobile/src/screens/client/ClientHome.js', 'w') as f:
    f.write(code)

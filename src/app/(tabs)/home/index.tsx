import {XStack, YStack} from "tamagui";
import {MyStack} from "../../../components/MyStack";
import {CardDemo} from "../../../components/CardDemo/CardDemo";
import {PrayerList} from "../../../components/PrayerList/PrayerList";
import {useEffect, useRef, useState} from "react";
import moment from "moment";
import DateTimePicker from '@react-native-community/datetimepicker';
import {XCircle} from "@tamagui/lucide-icons";
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as Location from "expo-location";
import {Platform} from "react-native";
import {I18n} from "i18n-js";
import fr from "../../../locales/french/fr.json";
import en from "../../../locales/english/en.json";
import useLanguageStore from "../../../store/languagesStore";
import {reloadAll, setArray, setItem} from "../../../../modules/widget";
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import {capitalizeFirstLetter} from "../../../utils/utils";
import {useOnboardingStore} from "../../../store/onBoardingStore";
import useGetPrayer from "../../../utils/useGetPrayer";
import {useLocationStore} from "../../../store/locationStore";
import AsyncStorage from "@react-native-async-storage/async-storage";


// Define a task name
const BACKGROUND_FETCH_TASK = 'MIDNIGHT_TASK';


TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    return BackgroundFetch.BackgroundFetchResult.NewData;
});

const GROUP_NAME = "group.com.mansjs.AlNoorPrayer";
const setSharedData = setItem(GROUP_NAME);
const setSharedDataArray = setArray(GROUP_NAME);

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

const App = () => {
    const [expoPushToken, setExpoPushToken] = useState<string>();
    const [notification, setNotification] = useState(false);
    const notificationListener = useRef();
    const responseListener = useRef();
    const [date, setDate] = useState(new Date());
    const [show, setShow] = useState(false);
    const today = new Date()
    const {
        transformedArray, } = useGetPrayer(date)
    const { currentPrayer, nextPrayerTime, nextPrayerName, transformedArray: prayersToday } = useGetPrayer(today)
    const [timeDifference, setTimeDifference] = useState(
        calculateTimeDifference(nextPrayerTime)
    )
    const { setLatitudeLongitude } = useLocationStore();


    useEffect(() => {
        const fetchLocation = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLatitudeLongitude(location.coords.latitude, location.coords.longitude);
        };

        fetchLocation();
    }, []);












    const onChange = (event, selectedDate) => {
        const currentDate = selectedDate;
        setShow(false);
        setDate(currentDate);
    };


    const reset = () => {
        setDate(today);
    };













    const { completeOnboarding } = useOnboardingStore()



    const formattedPrayerTimes = prayersToday.map(prayer => ({
        name: capitalizeFirstLetter(prayer.name),
        time: new Date(prayer.time).toLocaleTimeString('fr-FR', { hour12: false, hour: '2-digit', minute: '2-digit' })
    })).filter(prayer => prayer.name !== "Sunrise");



    const [nextPrayerTimeHours, setnextPrayerTimeHours] = useState<number | null>()
    const [nextPrayerTimeMinutes, setnextPrayerTimeMinutes] = useState<number | null>()


    // Format date to yyyy/mm/dd

    const currentMonthStreak = moment().month() + 1; // Months are 0-indexed, so add 1
    const currentYearStreak = moment().year();

    const [prayerStatus, setPrayerStatus] = useState([]);



    const loadPrayerStatus = async () => {
        try {
            const savedPrayerStatus = await AsyncStorage.getItem('globalPrayerStatus');
            if (savedPrayerStatus !== null) {
                setPrayerStatus(JSON.parse(savedPrayerStatus));
            } else {
                setPrayerStatus([]);
            }
        } catch (error) {
            console.error('Error loading prayer status:', error);
        }
    };


    const countMap = {};

    // Iterate over each object in the data array
    prayerStatus.forEach(entry => {
        const date = entry.date;
        let count = 0;

        // Count the number of prayers completed on this date
        Object.values(entry).forEach(value => {
            if (typeof value === 'boolean' && value === true) {
                count++;
            }
        });

        // Update the count for this date in the countMap
        countMap[date] = (countMap[date] || 0) + count;
    });

    useEffect(() => {
        loadPrayerStatus();
    }, []);

    const formatDateStreak = (dateStr) => {
        // Convert the string date to a Date object
        const date = new Date(dateStr);

        // Extract year, month, and day from the Date object
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        // Return formatted date string
        return `${year}-${month}-${day}`;
    };

    const formattedData = Object.entries(countMap).map(([date, count]) => ({
        date: formatDateStreak(date),
        count: count
    }));

    // Filter the streak days for the current month with a count of 5


    // Filter the array for dates with count 5 and in the current month






    useEffect(() => {
        setSharedDataArray("prayerTime", formattedPrayerTimes);
        //  setSharedData("prayerTime", formattedTime);
        setSharedData("prayerName", nextPrayerName);
        //      setSharedDataArray("streakDays", streakDays);
        reloadAll();


        const storeNextPrayer = async (nextPrayerName, nextPrayerTime) => {
            try {
                await AsyncStorage.setItem('nextPrayerName', nextPrayerName);
                await AsyncStorage.setItem('nextPrayerTime', nextPrayerTime.toString()); // Convert Date object to string
            } catch (error) {
                console.error('Error storing next prayer:', error);
            }
        };

        storeNextPrayer(nextPrayerName, nextPrayerTime);



        const intervalId = setInterval(() => {
            const difference = calculateTimeDifference(nextPrayerTime)
            setTimeDifference(difference)

            const nextPrayerTimeHours = Math.floor(Math.abs(timeDifference) / 3600)
            const nextPrayerTimeMinutes = Math.floor(
                (Math.abs(timeDifference) % 3600) / 60
            )

            setnextPrayerTimeHours(nextPrayerTimeHours)
            setnextPrayerTimeMinutes(nextPrayerTimeMinutes)
            // If the difference reaches 0, clear the interval
            if (difference <= 0) {
                clearInterval(intervalId)
            }
        }, 1000)
        return () => {
            clearInterval(intervalId) // Clean up the interval on unmount

        }
    }, [nextPrayerTime])






    useEffect(() => {
        completeOnboarding()
        registerForPushNotificationsAsync().then(token => setExpoPushToken(token));
        //@ts-ignore
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            //@ts-ignore

            setNotification(notification);
        });



        //@ts-ignore

        responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
        });

        return () => {
            Notifications.removeNotificationSubscription(notificationListener.current);
            Notifications.removeNotificationSubscription(responseListener.current);
        };
    }, []);


    const i18n = new I18n({
        ...fr,
        ...en,
    });

    const { language } = useLanguageStore();


    // const locale = getLocales();
    // const localeCode = locale[0].languageCode;

    i18n.defaultLocale = "en";
    i18n.locale = language;


    function calculateTimeDifference(targetTime) {
        const currentTime = moment();
        return moment(targetTime).diff(currentTime, "seconds");
    }



    const difference = calculateTimeDifference(nextPrayerTime);





    useEffect(() => {

        if (difference === 0) {
            // Calculate the next prayer time after the current time
            const nextPrayerAfterNow = prayersToday.find(prayer => new Date(prayer.time) > new Date());
            scheduleNextPrayerNotification(nextPrayerAfterNow.time, `It's time for ${nextPrayerAfterNow.name} prayer`);
            // If there's a prayer time after now, use it for scheduling notification
            if (nextPrayerAfterNow) {

                scheduleNextPrayerNotification(nextPrayerAfterNow.time, `It's time for ${nextPrayerAfterNow.name} prayer`);
            } else {
                // If no prayer time is found after now, the day's prayers have ended
                // You can handle this case as needed, maybe schedule a notification for the next day's Fajr prayer
            }
        } else {
            // If the difference is positive, schedule notification for the next prayer time
            scheduleNextPrayerNotification(nextPrayerTime, `It's time for ${nextPrayerName} prayer`);
        }



        // Register a background fetch task to update notifications
        if (Platform.OS === 'ios') {
            BackgroundFetch.setMinimumIntervalAsync(1); // Set the minimum interval for background fetch task
        }
        const task = BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
            minimumInterval: 1, // Minimum interval in minutes
            stopOnTerminate: false, // Continue executing even if the app is terminated
            startOnBoot: true, // Start the background task when the device boots up
        });

        return () => {
            task.then(() => {
                BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
            });
        };

    }, []);



    return (
        <>
            <MyStack>

                <YStack
                    space="$4"
                    paddingBottom="$18"
                >

                    <CardDemo
                        nextPrayerTime={nextPrayerTime}
                        nextPrayerName={nextPrayerName}
                        city={"city"}
                        date={date}
                        nextPrayerTimeHours={nextPrayerTimeHours}
                        nextPrayerTimeMinutes={nextPrayerTimeMinutes}
                        currentPrayer={currentPrayer} />


                    <XStack
                        display="flex"
                        alignItems="center"

                        justifyContent="center"
                        borderColor="$color"
                        borderRadius="$4"
                    >
                        <DateTimePicker
                            testID="dateTimePicker"
                            style={{ backgroundColor: "#4c6c53" }}
                            textColor="#ffffff"
                            themeVariant="dark"
                            collapsable={true}
                            value={date}
                            mode="date"
                            is24Hour={true}
                            onChange={onChange}
                        />
                        {date.toDateString() !== today.toDateString() && <XCircle onPress={reset} style={{ marginLeft: 6 }} size={24} color="red" />}

                    </XStack>

                    <PrayerList prayerList={transformedArray} />


                </YStack>


            </MyStack>

        </>
    );
}

// Function to schedule a notification for the next prayer time
async function scheduleNextPrayerNotification(dateTime, message) {
    await schedulePushNotification(dateTime, message); // Assume this function is already defined
}

async function schedulePushNotification(dateTime, message) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Al noorPrayer Time',
            body: message,
            sound: "default"
        },
        trigger: {
            date: dateTime,
        },
    });

}




export default App




async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            alert('Failed to get push token for push notification!');
            return;
        }
        // Learn more about projectId:
        // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
        token = (await Notifications.getExpoPushTokenAsync({ projectId: "9cba4f70-b7d4-4a38-afa4-9c9294a7258b" })).data;
        console.log(token);
    } else {
        alert('Must use physical device for Push Notifications');
    }

    return token;
}
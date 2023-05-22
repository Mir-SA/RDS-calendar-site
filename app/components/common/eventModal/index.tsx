import React, { useEffect, useState } from 'react';
import { useTransition, useSubmit, Form, useNavigate } from '@remix-run/react';
import * as Dialog from '@radix-ui/react-dialog';
import dayjs from 'dayjs';
import DatePicker from 'react-datepicker';
import { CalendarEventProps, CalEvent } from '~/utils/interfaces';
import UserInput from '../userInput';
import RdsCalendar from '../rdsCalendar';
import EventVisibility from '../eventVisibility';
import EmailChipsInput from '../emailChipsInput';
import { Button } from '../../Button';

interface EventModalProps {
  event?: CalEvent;
  eventsList: CalEvent[];
  currentEvent: CalEvent | undefined;
  createEvent?: (event: CalEvent) => void;
  isOpen?: boolean;
  setIsOpen: (show: boolean) => void;
  newEvent?: boolean;
  setCalendarEvent: React.Dispatch<React.SetStateAction<CalendarEventProps>>;
}

export default function EventModal({
  event,
  eventsList,
  currentEvent,
  isOpen = true,
  setCalendarEvent,
}: EventModalProps) {
  const [eventDetail, setEventDetail] = useState<CalEvent | undefined>(event);
  const submit = useSubmit();
  const transition = useTransition();
  const navigate = useNavigate();
  const minDate = dayjs(eventDetail?.start);
  const maxDate = dayjs(eventDetail?.end);
  const text =
    transition.state === 'submitting'
      ? 'Saving...'
      : transition.state === 'loading'
      ? 'Saved!'
      : 'submit';

  useEffect(() => {
    setEventDetail({
      ...eventDetail,
      title: event?.title,
      start: event?.start,
      end: event?.end,
      location: event?.location,
      description: event?.description,
      attendees: event?.attendees,
    });
  }, [event]);

  const dateRange = (startDate: Date, endDate: Date) => {
    const difference = dayjs(endDate).diff(startDate, 'minutes');
    const resultArray: Date[] = [startDate];

    for (let minute = 1; minute <= difference; minute += 1) {
      resultArray.push(dayjs(startDate).add(minute, 'minutes').toDate());
    }
    return resultArray;
  };

  const updateEventStateFromModal = (event: CalEvent) => {
    setCalendarEvent((e) => ({ ...e, event }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    console.log(transition.state);
    e.preventDefault();
    // grab the form element
    const $form = e.currentTarget;

    // get the formData from that form
    const formData = new FormData($form);

    const payload = {
      name: formData.get('title'),
      startTime: dayjs(eventDetail?.start).valueOf(),
      endTime: dayjs(eventDetail?.end).valueOf(),
      location: formData.get('address'),
      description: formData.get('description'),
      attendees: eventDetail?.attendees
        ? eventDetail.attendees.map(({ attendee }) => attendee.email)
        : [],
    };
    const formDataPayload = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      formDataPayload.append(key as string, value as string);
    });

    submit(formDataPayload, {
      method: 'patch',
      action: $form.getAttribute('action') ?? $form.action,
    });
  };

  return (
    <Dialog.Root open={isOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-20 bg-black bg-opacity-40 animate-overlayShow duration-150 transition-timing-cubic-bezier-0.16-1-0.3-1" />
        <Dialog.Content className="z-30 fixed top-0 left-0 w-screen h-[95vh] my-6 box-border bg-white rounded-lg shadow-lg animate-contentShow duration-150 transition-timing-cubic-bezier-0.16-1-0.3-1 focus:outline-none">
          <div className="h-full w-full flex">
            <Form method="patch" onSubmit={handleSubmit}>
              <div className="p-4 h-full w-full md:w-[400px] border-r-[1px] border-stone-50 overflow-auto">
                <Dialog.Close asChild>
                  <button
                    data-testid="modal-close-btn"
                    className="rounded-lg outline-none cursor-pointer py-2 px-4 text-sm bg-neutral-100 border-neutral-200 border-[1px] text-neutral-500"
                    aria-label="Close"
                    onClick={() => navigate(-1)}
                  >
                    CLOSE
                  </button>
                </Dialog.Close>

                <div className="p-2">
                  <Dialog.Title>
                    <UserInput
                      disabled={text !== 'submit'}
                      dataTestId="modal-title"
                      label=""
                      name="title"
                      placeholder="Enter Event Title"
                      inputClassnames="border-none font-normal text-[32px] mb-4 text-stone-500 m-0 !bg-white"
                      value={eventDetail?.title?.toString() ?? ''}
                      setValue={(title) => setEventDetail((ev) => ({ ...ev, title }))}
                    />
                  </Dialog.Title>

                  <EventVisibility
                    visibility={eventDetail?.visibility ?? 'private'}
                    setVisibility={(visibility) => setEventDetail((e) => ({ ...e, visibility }))}
                  />

                  <div className="mt-2">
                    <div data-testid="modal-from-date">
                      <p className="text-4 mb-2">From</p>
                      <DatePicker
                        disabled={text !== 'submit'}
                        placeholderText="from-date"
                        className="bg-stone-50 text-4 p-3 mb-6 focus:outline-none border border-solid border-stone-400 rounded-lg w-full cursor-pointer"
                        selected={minDate.toDate()}
                        maxDate={maxDate.toDate()}
                        timeIntervals={5}
                        excludeTimes={dateRange(
                          maxDate.toDate(),
                          dayjs(maxDate).endOf('day').toDate(),
                        )}
                        onChange={(start) => {
                          if (dayjs(start) < maxDate) {
                            setEventDetail((e) => ({ ...e, start: dayjs(start).toDate() }));
                          }
                        }}
                        showTimeSelect
                        dateFormat="MMMM d, yyyy h:mm aa"
                      />
                    </div>

                    <div data-testid="modal-to-date">
                      <p className="text-4 mb-2">To</p>
                      <DatePicker
                        disabled={text !== 'submit'}
                        placeholderText="to-date"
                        className="bg-stone-50 text-4 p-3 mb-6 focus:outline-none border border-solid border-stone-400 rounded-lg w-full cursor-pointer"
                        minDate={minDate.toDate()}
                        selected={maxDate.toDate()}
                        timeIntervals={5}
                        excludeTimes={dateRange(
                          dayjs(minDate).startOf('day').toDate(),
                          minDate.toDate(),
                        )}
                        onChange={(end) => {
                          if (minDate < dayjs(end)) {
                            setEventDetail((e) => ({ ...e, end: dayjs(end).toDate() }));
                          }
                        }}
                        showTimeSelect
                        dateFormat="MMMM d, yyyy h:mm aa"
                      />
                    </div>

                    <EmailChipsInput
                      label="Attendees Emails"
                      placeholder="Attendees Emails"
                      attendees={eventDetail?.attendees ?? []}
                      setAttendees={(attendees) => setEventDetail((ev) => ({ ...ev, attendees }))}
                    />

                    <UserInput
                      disabled={text !== 'submit'}
                      dataTestId="modal-location"
                      label="URL / Address"
                      name="address"
                      labelClassnames="text-4"
                      placeholder="Enter URL or Address for the event"
                      value={eventDetail?.location ?? ''}
                      setValue={(location) => setEventDetail((ev) => ({ ...ev, location }))}
                    />

                    <p className="text-4 mb-2">Description</p>
                    <textarea
                      disabled={text !== 'submit'}
                      aria-label="Event Description"
                      className="bg-stone-50 text-4 p-3 mb-6 focus:outline-none border border-solid border-stone-400 rounded-lg w-full"
                      rows={2}
                      cols={50}
                      name="description"
                      placeholder="Event Description"
                      value={eventDetail?.description ?? ''}
                      onChange={(e) =>
                        setEventDetail((ev) => ({ ...ev, description: e.target.value }))
                      }
                    ></textarea>

                    <Button dataTestId="modal-save-btn" label={text} type="submit" />
                  </div>
                </div>
              </div>
            </Form>
            <div className="flex-auto hidden md:block">
              <RdsCalendar
                height="100%"
                view="day"
                eventsList={eventsList}
                defaultDate={currentEvent?.start}
                currentEvent={currentEvent}
                setCalendarEvent={setCalendarEvent}
                updateEvent={updateEventStateFromModal}
              />
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
